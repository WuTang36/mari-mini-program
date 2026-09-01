// 云函数：getMyFeedback
// 查询当前用户提交的反馈（按时间倒序，最多 50 条）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const res = await db.collection('feedbacks')
      .where({ _openid: wxContext.OPENID })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const list = (res.data || []).map(r => ({
      id: r._id,
      content: r.content || '',
      media: r.media || [],
      contact: r.contact || '',
      dateText: formatTime(r.createdAt)
    }));

    return { success: true, list };
  } catch (err) {
    console.error('getMyFeedback 失败:', err.errMsg || err);
    return { success: false, errMsg: err.errMsg || err.message, list: [] };
  }
};
