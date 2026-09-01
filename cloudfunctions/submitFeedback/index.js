// 云函数：submitFeedback
// 接收用户反馈并写入云数据库 feedbacks 集合
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const content = (event.content || '').trim();

  if (!content) {
    return { success: false, errMsg: '反馈内容不能为空' };
  }

  try {
    const res = await db.collection('feedbacks').add({
      data: {
        _openid: wxContext.OPENID,
        content,
        media: Array.isArray(event.media) ? event.media : [],
        contact: (event.contact || '').trim(),
        createdAt: db.serverDate()
      }
    });
    return { success: true, id: res._id };
  } catch (err) {
    console.error('submitFeedback 失败:', err.errMsg || err);
    return { success: false, errMsg: err.errMsg || err.message };
  }
};
