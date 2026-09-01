/**
 * 数据存储层 - 云数据库
 * 所有方法内置容错：云调用失败返回空数据，不抛异常阻塞页面
 */
const app = getApp();

// ========== 工具：图片地址清洗 ==========

/** 仅保留云存储 cloud:// 路径，过滤 wxfile:// 等临时路径（防止 Skyline ENOENT 报错） */
function safeFileUrl(url) {
  if (!url) return '';
  return url.indexOf('cloud://') === 0 ? url : '';
}

/** 清洗宠物文档中的图片字段，返回新对象 */
function sanitizePetImages(pet) {
  if (!pet) return pet;

  const result = { ...pet };

  if (result.avatarUrl) {
    result.avatarUrl = safeFileUrl(result.avatarUrl);
  }

  if (Array.isArray(result.vaccineRecords)) {
    result.vaccineRecords = result.vaccineRecords.map(r => ({
      ...r,
      photoUrl: safeFileUrl(r.photoUrl)
    }));
  }

  if (Array.isArray(result.medicalRecords)) {
    result.medicalRecords = result.medicalRecords.map(r => ({
      ...r,
      photoUrl: safeFileUrl(r.photoUrl)
    }));
  }

  if (result.pedigreeInfo && result.pedigreeInfo.certPhoto) {
    result.pedigreeInfo = {
      ...result.pedigreeInfo,
      certPhoto: safeFileUrl(result.pedigreeInfo.certPhoto)
    };
  }

  return result;
}

// ========== 宠物 ==========

async function getPets() {
  try {
    const db = wx.cloud.database();
    const res = await db.collection('pets').get();
    return (res.data || []).map(sanitizePetImages);
  } catch (err) {
    console.error('getPets 失败:', err.errMsg);
    return [];
  }
}

/** 读取已删除但保留日记的宠物（归档，用于相册 Tab） */
async function getDeletedPets() {
  try {
    const db = wx.cloud.database();
    const res = await db.collection('deleted_pets').get();
    return (res.data || []).map(p => ({
      ...p,
      avatarUrl: safeFileUrl(p.avatarUrl),
      _id: p.petId || p._id,
      isDeleted: true
    }));
  } catch (err) {
    if (isCollectionMissing(err)) return [];
    console.error('getDeletedPets 失败:', err.errMsg);
    return [];
  }
}

async function getPet(id) {
  try {
    const db = wx.cloud.database();
    const res = await db.collection('pets').doc(id).get();
    return sanitizePetImages(res.data || null);
  } catch (err) {
    console.error('getPet 失败:', err.errMsg);
    return null;
  }
}

async function addPet(data) {
  const db = wx.cloud.database();
  const res = await db.collection('pets').add({ data });
  return res._id;
}

async function updatePet(id, data) {
  const db = wx.cloud.database();
  await db.collection('pets').doc(id).update({ data });
}

async function deletePet(id) {
  const db = wx.cloud.database();
  await db.collection('pets').doc(id).remove();
}

// ========== 用户 ==========

async function getUserProfile() {
  const openid = app.globalData.openid;
  if (!openid) return null;
  try {
    const db = wx.cloud.database();
    const res = await db.collection('users').where({ _openid: openid }).get();
    return res.data && res.data.length > 0 ? res.data[0] : null;
  } catch (err) {
    console.error('getUserProfile 失败:', err.errMsg);
    return null;
  }
}

async function saveUserProfile(data) {
  const openid = app.globalData.openid;
  if (!openid) throw new Error('未登录');
  try {
    const db = wx.cloud.database();
    const profile = await getUserProfile();
    if (profile) {
      await db.collection('users').doc(profile._id).update({ data });
    } else {
      await db.collection('users').add({ data });
    }
  } catch (err) {
    console.error('saveUserProfile 失败:', err.errMsg);
    throw err;
  }
}

// ========== 订阅状态 ==========

/** 读取当前用户订阅状态（是否已订阅提醒） */
async function getSubscribeStatus() {
  const openid = app.globalData.openid;
  if (!openid) return false;
  try {
    const db = wx.cloud.database();
    const res = await db.collection('subscriptions').where({ _openid: openid }).get();
    return res.data && res.data.length > 0 ? !!res.data[0].subscribed : false;
  } catch (err) {
    // 集合未创建时静默容错，不刷屏
    if (isCollectionMissing(err)) return false;
    console.error('getSubscribeStatus 失败:', err.errMsg);
    return false;
  }
}

/** 保存当前用户订阅状态 */
async function setSubscribeStatus(subscribed) {
  const openid = app.globalData.openid;
  if (!openid) return;
  try {
    const db = wx.cloud.database();
    const res = await db.collection('subscriptions').where({ _openid: openid }).get();
    if (res.data && res.data.length > 0) {
      await db.collection('subscriptions').doc(res.data[0]._id).update({
        data: { subscribed: !!subscribed, updatedAt: db.serverDate() }
      });
    } else {
      await db.collection('subscriptions').add({
        data: { subscribed: !!subscribed, subscribedAt: db.serverDate(), updatedAt: db.serverDate() }
      });
    }
  } catch (err) {
    // 集合未创建时静默容错，不刷屏
    if (isCollectionMissing(err)) return;
    console.error('setSubscribeStatus 失败:', err.errMsg);
  }
}

/** 判断是否为云数据库集合不存在错误 */
function isCollectionMissing(err) {
  const msg = (err && (err.errMsg || err.message)) || '';
  return msg.indexOf('collection not exists') > -1 ||
    msg.indexOf('Db or Table not exist') > -1 ||
    msg.indexOf('ResourceNotFound') > -1;
}

// ========== 提醒已读状态 ==========

/** 读取当前用户所有已读提醒 id */
async function getReadReminderIds() {
  try {
    const db = wx.cloud.database();
    // 集合权限「仅创建者可读写」下 get() 自动只返回当前用户记录，
    // 不依赖 app.globalData.openid，避免冷启动 openid 未就绪时读不到已读状态
    const res = await db.collection('reminder_reads').get();
    return (res.data || []).map(r => r.reminderId);
  } catch (err) {
    if (isCollectionMissing(err)) return [];
    console.error('getReadReminderIds 失败:', err.errMsg);
    return [];
  }
}

/** 标记单条提醒已读（持久化） */
async function markReminderRead(reminderId) {
  if (!reminderId) return;
  try {
    const db = wx.cloud.database();
    // 权限「仅创建者可读写」下按 reminderId 查询即当前用户记录
    const res = await db.collection('reminder_reads').where({ reminderId }).get();
    if (res.data && res.data.length > 0) {
      await db.collection('reminder_reads').doc(res.data[0]._id).update({
        data: { read: true, updatedAt: db.serverDate() }
      });
    } else {
      await db.collection('reminder_reads').add({
        data: { reminderId, read: true, updatedAt: db.serverDate() }
      });
    }
  } catch (err) {
    console.error('markReminderRead 失败:', err.errMsg);
  }
}

/** 批量标记全部已读（持久化） */
async function markAllRemindersRead(reminderIds) {
  if (!reminderIds || !reminderIds.length) return;
  try {
    const db = wx.cloud.database();
    const res = await db.collection('reminder_reads').get();
    const existing = new Set((res.data || []).map(r => r.reminderId));
    const toAdd = reminderIds.filter(id => !existing.has(id));
    const tasks = toAdd.map(id => db.collection('reminder_reads').add({
      data: { reminderId: id, read: true, updatedAt: db.serverDate() }
    }));
    await Promise.all(tasks);
  } catch (err) {
    console.error('markAllRemindersRead 失败:', err.errMsg);
  }
}

// ========== 提醒 ==========

async function getReminders() {
  try {
    const pets = await getPets();
    if (!pets.length) return [];

    const { formatDate } = require('./util');
    const today = formatDate(new Date());
    const readIds = await getReadReminderIds();
    const readSet = new Set(readIds);
    const reminders = [];

    pets.forEach(pet => {
      (pet.vaccineRecords || []).forEach((v, i) => {
        if (v.nextDate) {
          const id = pet._id + '_v_' + i;
          reminders.push({
            id,
            petId: pet._id,
            petName: pet.name,
            petAvatar: pet.avatarUrl || pet.avatar || '',
            type: 'vaccine',
            title: (v.name || '疫苗') + '到期',
            desc: (v.clinic ? '上次接种：' + v.date + ' · ' + v.clinic : '上次接种：' + v.date),
            dueDate: v.nextDate,
            icon: '💉',
            read: readSet.has(id) || v.nextDate < today
          });
        }
      });

      (pet.dewormingRecords || []).forEach((d, i) => {
        if (d.nextDate) {
          const id = pet._id + '_d_' + i;
          reminders.push({
            id,
            petId: pet._id,
            petName: pet.name,
            petAvatar: pet.avatarUrl || pet.avatar || '',
            type: 'deworming',
            title: (d.type === '体内' ? '体内' : '体外') + '驱虫到期',
            desc: '上次驱虫：' + d.date + ' · ' + (d.medicine || ''),
            dueDate: d.nextDate,
            icon: '🪱',
            read: readSet.has(id) || d.nextDate < today
          });
        }
      });

      if (pet.birthday) {
        const id = pet._id + '_bday';
        const bDate = new Date(pet.birthday.replace(/-/g, '/'));
        const thisYearBirthday = new Date(new Date().getFullYear(), bDate.getMonth(), bDate.getDate());
        const bStr = formatDate(thisYearBirthday);
        const age = new Date().getFullYear() - bDate.getFullYear();
        reminders.push({
          id,
          petId: pet._id,
          petName: pet.name,
          petAvatar: pet.avatarUrl || pet.avatar || '',
          type: 'birthday',
          title: age + '岁生日',
          desc: bStr < today ? '已于 ' + bStr + ' 庆祝' : '准备好蛋糕和礼物哦～',
          dueDate: bStr,
          icon: '🎂',
          read: readSet.has(id) || bStr < today
        });
      }
    });

    return reminders.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } catch (err) {
    console.error('getReminders 失败:', err.errMsg);
    return [];
  }
}

// ========== 成长日记 ==========

async function getDiaries(petId, skip = 0, limit = 20) {
  try {
    const db = wx.cloud.database();
    const res = await db.collection('diaries').where({ petId }).skip(skip).limit(limit).get();
    return res.data || [];
  } catch (err) {
    // 集合不存在时静默返回空数组
    return [];
  }
}

async function addDiary(data) {
  try {
    const db = wx.cloud.database();
    const res = await db.collection('diaries').add({ data });
    return res._id;
  } catch (err) {
    console.error('addDiary 失败:', err.errMsg);
    throw err;
  }
}

module.exports = {
  getPets, getDeletedPets, getPet, addPet, updatePet, deletePet,
  getUserProfile, saveUserProfile,
  getSubscribeStatus, setSubscribeStatus,
  getReadReminderIds, markReminderRead, markAllRemindersRead,
  getReminders,
  getDiaries, addDiary
};
