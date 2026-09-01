// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前微信版本不支持云开发，请升级');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-d7gq5krzxedfe3677',
      traceUser: true
    });

    // 调用 login 云函数获取 openid（5 秒超时）
    const { callFunction } = require('./utils/cloud');
    callFunction('login', {}, { timeout: 5000 })
      .then(res => {
        this.globalData.openid = res.result.openid;
        this.globalData.cloudReady = true;
        console.log('云开发就绪，openid:', res.result.openid);
        this.loadUserProfile();
      })
      .catch(err => {
        console.error('登录云函数调用失败（可能未部署），err:', err.errMsg || err);
        this.globalData.cloudReady = false;
      });
  },

  /** 从云数据库加载用户资料 */
  async loadUserProfile() {
    const openid = this.globalData.openid;
    if (!openid) return;
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({ _openid: openid }).get();
      if (res.data && res.data.length > 0) {
        const profile = res.data[0];
        this.globalData.userInfo = {
          avatarUrl: profile.avatarUrl || '',
          nickName: profile.nickName || ''
        };
      }
    } catch (err) {
      console.error('加载用户资料失败（users 集合可能未创建）:', err.errMsg);
    }
  },

  globalData: {
    openid: null,
    cloudReady: false,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    }
  }
});
