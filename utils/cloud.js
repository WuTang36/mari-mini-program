/**
 * 云函数调用封装
 * 统一打印请求参数与返回结果日志，便于排查问题
 */
function callFunction(name, data, options = {}) {
  console.log('[cloud] 调用云函数:', name, '参数:', data ? JSON.stringify(data) : '(无)');
  return wx.cloud.callFunction({ name, data, timeout: options.timeout })
    .then(res => {
      console.log('[cloud] 云函数返回:', name, '结果:', JSON.stringify(res.result || res));
      return res;
    })
    .catch(err => {
      console.error('[cloud] 云函数失败:', name, err.errMsg || err);
      throw err;
    });
}

module.exports = { callFunction };
