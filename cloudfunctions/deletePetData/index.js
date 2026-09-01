// 云函数：deletePetData
//  - petAndDiaries：删除宠物 + 全部日记 + 清理归档
//  - petOnly（默认）：先归档到 deleted_pets（相册保留该宠物 Tab 查看保留的日记），归档成功后再删宠物；
//                   归档失败则中止删除，宠物档案保留，避免"删了宠物但 Tab 丢失"
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { petId, mode, deleteDiaries } = event || {};
  if (!petId) {
    return { success: false, errMsg: '缺少 petId' };
  }
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 显式枚举判断：仅 mode === 'petAndDiaries' 或 deleteDiaries === true 时删除日记
  const shouldDeleteDiaries = mode === 'petAndDiaries' || deleteDiaries === true;

  try {
    if (shouldDeleteDiaries) {
      // ===== 删除宠物 + 日记 + 清理归档 =====
      await db.collection('pets').doc(petId).remove();

      // 删除该宠物全部日记
      let deletedDiaries = 0;
      const MAX_LIMIT = 100;
      while (true) {
        const res = await db.collection('diaries').where({ petId }).limit(MAX_LIMIT).get();
        if (!res.data.length) break;
        const ids = res.data.map(d => d._id);
        await Promise.all(ids.map(id => db.collection('diaries').doc(id).remove()));
        deletedDiaries += ids.length;
        if (res.data.length < MAX_LIMIT) break;
      }

      // 清理归档（集合不存在时忽略）
      try {
        const archived = await db.collection('deleted_pets').where({ petId }).get();
        await Promise.all(archived.data.map(a => db.collection('deleted_pets').doc(a._id).remove()));
      } catch (e) {
        // deleted_pets 集合不存在，忽略
      }

      return { success: true, mode: 'petAndDiaries', deletedDiaries };
    }

    // ===== 仅删除宠物（先归档，成功后再删） =====
    let petInfo = null;
    try {
      const petRes = await db.collection('pets').doc(petId).get();
      petInfo = petRes.data || null;
    } catch (err) {
      petInfo = null;
    }
    if (!petInfo) {
      return { success: false, errMsg: '宠物不存在或已删除' };
    }

    // 1. 写入归档（集合不存在会抛错 → 中止，宠物保留）
    const archiveData = {
      _openid: openid,
      petId,
      name: petInfo.name || '',
      avatar: petInfo.avatar || '',
      avatarUrl: petInfo.avatarUrl || '',
      breed: petInfo.breed || '',
      gender: petInfo.gender || '',
      deletedAt: db.serverDate()
    };
    const existed = await db.collection('deleted_pets').where({ petId }).get();
    if (existed.data && existed.data.length > 0) {
      await db.collection('deleted_pets').doc(existed.data[0]._id).update({ data: archiveData });
    } else {
      await db.collection('deleted_pets').add({ data: archiveData });
    }

    // 2. 归档成功后才删除宠物档案
    await db.collection('pets').doc(petId).remove();

    return { success: true, mode: 'petOnly', deletedDiaries: 0, archived: true };
  } catch (err) {
    console.error('deletePetData 失败:', err.errMsg || err);
    return { success: false, errMsg: err.errMsg || err.message };
  }
};
