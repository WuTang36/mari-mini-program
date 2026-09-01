const app = getApp();
const { saveUserProfile } = require('../../utils/storage');

Component({
  data: {
    avatarUrl: '',
    nickName: '',
    uploading: false
  },

  lifetimes: {
    attached() {
      this._initForm();
    }
  },

  methods: {
    _initForm() {
      const info = app.globalData.userInfo || {};
      const avatarUrl = info.avatarUrl || '';
      this.setData({
        // 只保留云存储路径，过滤 wxfile:// 临时路径
        avatarUrl: avatarUrl.indexOf('cloud://') === 0 ? avatarUrl : '',
        nickName: info.nickName || ''
      });
    },

    /** 头像加载失败 → 清空回退占位 */
    onAvatarError() {
      this.setData({ avatarUrl: '' });
    },

    onChooseAvatar(e) {
      const tempPath = e.detail.avatarUrl;
      if (!tempPath) return;

      wx.showLoading({ title: '上传中…' });
      this.setData({ uploading: true });

      const openid = app.globalData.openid || 'unknown';
      const cloudPath = 'avatars/' + openid + '_' + Date.now() + '.jpg';
      wx.cloud.uploadFile({
        cloudPath,
        filePath: tempPath,
        success: (res) => {
          this.setData({ avatarUrl: res.fileID, uploading: false });
          wx.hideLoading();
        },
        fail: (err) => {
          console.error('头像上传失败:', err);
          wx.hideLoading();
          wx.showToast({ title: '上传失败，请重试', icon: 'none' });
          this.setData({ uploading: false });
        }
      });
    },

    onNicknameInput(e) {
      this.setData({ nickName: e.detail.value });
    },

    async onSave() {
      const { avatarUrl, nickName } = this.data;
      if (!nickName || !nickName.trim()) {
        wx.showToast({ title: '昵称不能为空', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '保存中…' });

      try {
        // avatarUrl 已经是 cloud:// 路径，无需再次上传
        const info = {
          avatarUrl: avatarUrl || '',
          nickName: nickName.trim()
        };

        app.globalData.userInfo = info;

        await saveUserProfile({
          avatarUrl: info.avatarUrl,
          nickName: info.nickName,
          updatedAt: new Date().toISOString()
        });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('保存失败:', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
