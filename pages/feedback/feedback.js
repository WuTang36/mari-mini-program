const MAX_MEDIA = 3;

/** 根据文件名后缀判断媒体类型 */
function mediaTypeOf(url) {
  return /\.(mp4|mov|m4v|avi|webm)$/i.test(url) ? 'video' : 'image';
}

Component({
  data: {
    form: { content: '', contact: '' },
    media: [], // [{ url, type }]
    saving: false
  },

  methods: {
    onFieldInput(e) {
      const field = e.currentTarget.dataset.field;
      this.setData({ ['form.' + field]: e.detail.value });
    },

    chooseMedia() {
      const remain = MAX_MEDIA - this.data.media.length;
      if (remain <= 0) {
        wx.showToast({ title: '最多上传 3 个', icon: 'none' });
        return;
      }
      wx.chooseMedia({
        count: remain,
        mediaType: ['image', 'video'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          wx.showLoading({ title: '上传中…' });
          this._uploadMedia(res.tempFiles, 0, []);
        }
      });
    },

    _uploadMedia(files, index, uploaded) {
      if (index >= files.length) {
        wx.hideLoading();
        this.setData({ 'media': [...this.data.media, ...uploaded] });
        return;
      }
      const file = files[index];
      const ext = file.tempFilePath.split('.').pop() || 'jpg';
      const cloudPath = 'feedback-media/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      wx.cloud.uploadFile({
        cloudPath,
        filePath: file.tempFilePath,
        success: (uploadRes) => {
          uploaded.push({ url: uploadRes.fileID, type: mediaTypeOf(uploadRes.fileID) });
          this._uploadMedia(files, index + 1, uploaded);
        },
        fail: (err) => {
          console.error('上传媒体失败:', err);
          this._uploadMedia(files, index + 1, uploaded);
        }
      });
    },

    removeMedia(e) {
      const idx = e.currentTarget.dataset.index;
      const media = [...this.data.media];
      media.splice(idx, 1);
      this.setData({ media });
    },

    goMyFeedback() {
      wx.navigateTo({ url: '/pages/my-feedback/my-feedback' });
    },

    async submitFeedback() {
      const { form, media, saving } = this.data;
      if (saving) return;

      const content = (form.content || '').trim();
      if (!content) {
        wx.showToast({ title: '请填写反馈内容', icon: 'none' });
        return;
      }

      this.setData({ saving: true });
      wx.showLoading({ title: '提交中…' });

      try {
        const { callFunction } = require('../../utils/cloud');
        const res = await callFunction('submitFeedback', {
          content,
          contact: (form.contact || '').trim(),
          media: media.map(m => m.url)
        });

        const result = res.result || {};
        if (!result.success) {
          throw new Error(result.errMsg || '提交失败');
        }

        wx.hideLoading();
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1200);
      } catch (err) {
        wx.hideLoading();
        console.error('提交反馈失败:', err);
        wx.showToast({ title: '提交失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    }
  }
});
