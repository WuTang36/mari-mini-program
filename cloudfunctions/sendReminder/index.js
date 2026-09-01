// 云函数：sendReminder
// 定时扫描宠物到期提醒（疫苗/驱虫/生日）并推送微信订阅消息
//   - 疫苗/驱虫到期：到期前 7 天和当天各推送一次
//   - 生日：每年生日前 3 天和当天各推送一次
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 订阅消息模板 ID（小程序后台 → 功能 → 订阅消息 申请）
// 疫苗/驱虫到期模板：关键字为 复查时间、剩余天数、备注
const TEMPLATE_ID = 'DG-B5rqPc65CeE8eo0JjcdNrQd90dc9wakSo5auDZ7U';
// 生日提醒模板：关键字为 日程时间、温馨提示
const BIRTHDAY_TEMPLATE_ID = 'n2U04kHIkdjq_vz4fxYnmqnEVOx6xVAD37debwkw6Uk';

// 推送版本：开发版 developer / 体验版 trial / 正式版 formal
// 本地调试用 developer，正式发布前改为 formal
const MINIPROGRAM_STATE = 'developer';

// 疫苗/驱虫：到期前 7 天和当天；生日：前 3 天和当天
const REMIND_DAYS_VACCINE = [7, 0];
const REMIND_DAYS_BIRTHDAY = [3, 0];

/** 格式化日期 YYYY-MM-DD */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

/** 计算距今天数（当天为 0，未来为正） */
function daysFromNow(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr.replace(/-/g, '/'));
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

/** 扫描全部宠物，生成到期提醒列表 */
async function collectReminders() {
  const reminders = [];
  const now = new Date();
  const today = formatDate(now);

  const MAX_LIMIT = 1000;
  let offset = 0;
  let pets = [];
  while (true) {
    const res = await db.collection('pets').skip(offset).limit(MAX_LIMIT).get();
    pets = pets.concat(res.data);
    if (res.data.length < MAX_LIMIT) break;
    offset += MAX_LIMIT;
  }

  pets.forEach(pet => {
    const openid = pet._openid;
    if (!openid) return;

    (pet.vaccineRecords || []).forEach((v, i) => {
      if (v.nextDate) {
        reminders.push({
          type: 'vaccine',
          openid,
          id: pet._id + '_v_' + i,
          dueDate: v.nextDate,
          title: (v.name || '疫苗') + '到期',
          desc: '上次接种：' + (v.date || '') + (v.clinic ? ' · ' + v.clinic : '')
        });
      }
    });

    (pet.dewormingRecords || []).forEach((d, i) => {
      if (d.nextDate) {
        reminders.push({
          type: 'deworming',
          openid,
          id: pet._id + '_d_' + i,
          dueDate: d.nextDate,
          title: (d.type === '体内' ? '体内' : '体外') + '驱虫到期',
          desc: '上次驱虫：' + (d.date || '') + (d.medicine ? ' · ' + d.medicine : '')
        });
      }
    });

    if (pet.birthday) {
      const bDate = new Date(pet.birthday.replace(/-/g, '/'));
      const thisYearBirthday = new Date(now.getFullYear(), bDate.getMonth(), bDate.getDate());
      const bStr = formatDate(thisYearBirthday);
      const age = now.getFullYear() - bDate.getFullYear();
      reminders.push({
        type: 'birthday',
        openid,
        id: pet._id + '_bday',
        dueDate: bStr,
        title: age + '岁生日',
        desc: bStr < today ? '今天过生日，快送上祝福～' : '生日快到啦，记得准备蛋糕和礼物哦～'
      });
    }
  });

  return reminders;
}

/** 检查该提醒在指定剩余天数、指定到期日期下是否已发送过（dueDate 防止跨年生日去重误判） */
async function hasSent(reminderId, daysLeft, dueDate) {
  const res = await db.collection('reminder_sends').where({
    reminderId,
    daysLeft,
    dueDate
  }).count();
  return res.total > 0;
}

exports.main = async (event, context) => {
  const sent = [];
  const skipped = [];

  try {
    const reminders = await collectReminders();
    const today = formatDate(new Date());

    for (const r of reminders) {
      const daysLeft = daysFromNow(r.dueDate);

      // 按类型选择提醒策略
      const remindDays = r.type === 'birthday' ? REMIND_DAYS_BIRTHDAY : REMIND_DAYS_VACCINE;
      if (!remindDays.includes(daysLeft)) {
        skipped.push({ id: r.id, type: r.type, daysLeft });
        continue;
      }

      // 已发送过则跳过，保证每个时间点各提醒一次
      const already = await hasSent(r.id, daysLeft, r.dueDate);
      if (already) {
        skipped.push({ id: r.id, type: r.type, daysLeft, reason: 'sent' });
        continue;
      }

      try {
        // 生日用生日模板，其余用到期模板
        if (r.type === 'birthday') {
          await cloud.openapi.subscribeMessage.send({
            touser: r.openid,
            templateId: BIRTHDAY_TEMPLATE_ID,
            page: 'pages/reminder-center/reminder-center',
            miniprogramState: MINIPROGRAM_STATE,
            data: {
              日程时间: { value: r.dueDate },
              温馨提示: { value: r.title + '，' + r.desc }
            }
          });
        } else {
          await cloud.openapi.subscribeMessage.send({
            touser: r.openid,
            templateId: TEMPLATE_ID,
            page: 'pages/reminder-center/reminder-center',
            miniprogramState: MINIPROGRAM_STATE,
            data: {
              复查时间: { value: r.dueDate },
              剩余天数: { value: daysLeft === 0 ? '今天' : daysLeft + '天' },
              备注: { value: r.title + '，' + r.desc }
            }
          });
        }

        // 记录发送，避免重复推送
        await db.collection('reminder_sends').add({
          data: {
            reminderId: r.id,
            type: r.type,
            daysLeft,
            dueDate: r.dueDate,
            sentAt: db.serverDate()
          }
        });

        sent.push({ id: r.id, type: r.type, daysLeft });
      } catch (err) {
        console.error('发送订阅消息失败:', r.id, err.errMsg || err);
        skipped.push({ id: r.id, type: r.type, daysLeft, reason: err.errMsg || err.message });
      }
    }

    return {
      success: true,
      today,
      sent,
      skipped: skipped.length
    };
  } catch (err) {
    console.error('sendReminder 执行失败:', err);
    return { success: false, errMsg: err.errMsg || err.message };
  }
};
