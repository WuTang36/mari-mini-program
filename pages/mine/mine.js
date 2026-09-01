const app = getApp();
const { getPets, getUserProfile, saveUserProfile } = require('../../utils/storage');

Component({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    petCount: 0,
    isLoggedIn: false,
    showAbout: false
  },

  lifetimes: {
    attached() {
      this._initUserInfo();
      this._loadPetCount();
    }
  },

  pageLifetimes: {
    show() {
      this._initUserInfo();
      this._loadPetCount();
    }
  },

  methods: {
    async _initUserInfo() {
      const cached = app.globalData.userInfo || {};
      if (cached.nickName) {
        // 过滤掉 wxfile:// 临时路径
        const safeAvatar = this._safeAvatar(cached.avatarUrl);
        this.setData({ userInfo: { ...cached, avatarUrl: safeAvatar }, isLoggedIn: true });
        return;
      }
      try {
        const profile = await getUserProfile();
        if (profile && profile.nickName) {
          const safeAvatar = this._safeAvatar(profile.avatarUrl);
          app.globalData.userInfo = { avatarUrl: safeAvatar, nickName: profile.nickName };
          this.setData({ userInfo: app.globalData.userInfo, isLoggedIn: true });
        }
      } catch (err) {
        // 忽略
      }
    },

    /** 过滤 wxfile:// 和 http:// 临时路径，只保留 cloud:// */
    _safeAvatar(url) {
      if (!url) return '';
      if (url.startsWith('cloud://')) return url;
      return '';
    },

    /** 头像加载失败 → 回退 emoji 占位 */
    onAvatarError() {
      this.setData({ 'userInfo.avatarUrl': '' });
    },

    async _loadPetCount() {
      try {
        const pets = await getPets();
        this.setData({ petCount: pets.length });
      } catch (err) {
        // 忽略
      }
    },

    /** 上传头像到云存储，返回 cloud:// fileID */
    async _uploadAvatar(tempPath) {
      const openid = app.globalData.openid || 'unknown';
      const cloudPath = 'avatars/' + openid + '_' + Date.now() + '.jpg';
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath });
      return uploadRes.fileID;
    },

    /** 点击卡片：未登录触发登录，已登录无操作 */
    onCardTap() {
      if (this.data.isLoggedIn) return;

      wx.getUserProfile({
        desc: '用于完善宠物主人资料',
        success: async (res) => {
          if (!res.userInfo) return;

          // 先查云数据库，已有资料则复用（保证同一 openid 昵称唯一）
          let nickName = '';
          let avatarUrl = '';
          try {
            const profile = await getUserProfile();
            if (profile && profile.nickName) {
              nickName = profile.nickName;
              avatarUrl = this._safeAvatar(profile.avatarUrl);
            }
          } catch (err) {
            // 忽略
          }

          // 首次登录：生成唯一随机昵称
          if (!nickName) {
            nickName = '铲屎官_' + Math.random().toString(36).slice(2, 6);

            // 上传微信返回的临时头像到云存储
            const tempAvatar = res.userInfo.avatarUrl;
            if (tempAvatar && (tempAvatar.startsWith('wxfile://') || tempAvatar.startsWith('http://'))) {
              wx.showLoading({ title: '登录中…' });
              try {
                avatarUrl = await this._uploadAvatar(tempAvatar);
              } catch (uploadErr) {
                console.error('头像上传失败:', uploadErr);
                avatarUrl = '';
              }
              wx.hideLoading();
            }
          }

          const info = { avatarUrl, nickName };
          app.globalData.userInfo = info;
          this.setData({ userInfo: info, isLoggedIn: true });
          saveUserProfile({
            avatarUrl,
            nickName,
            updatedAt: new Date().toISOString()
          }).catch(err => console.error('保存用户资料失败:', err));
        },
        fail: (err) => {
          console.warn('getUserProfile 失败:', err.errMsg);
        }
      });
    },

    /** 打开关于我们弹窗 */
    showAbout() {
      this.setData({ showAbout: true });
    },

    /** 关闭关于我们弹窗 */
    hideAbout() {
      this.setData({ showAbout: false });
    },

    logout() {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            app.globalData.userInfo = { avatarUrl: '', nickName: '' };
            this.setData({ userInfo: { avatarUrl: '', nickName: '' }, isLoggedIn: false });
          }
        }
      });
    },

    goReminderCenter() {
      wx.navigateTo({ url: '/pages/reminder-center/reminder-center' });
    },

    goFeedback() {
      wx.navigateTo({ url: '/pages/feedback/feedback' });
    },

    goProfileEdit() {
      wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
    }
  }
});
