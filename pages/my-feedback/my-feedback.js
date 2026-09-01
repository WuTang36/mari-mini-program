Component({
  data: {
    list: [],
    loading: true
  },

  lifetimes: {
    attached() {
      this.loadFeedback();
    }
  },

  pageLifetimes: {
    show() {
      this.loadFeedback();
    }
  },

  methods: {
    async loadFeedback() {
      this.setData({ loading: true });
      try {
        const { callFunction } = require('../../utils/cloud');
        const res = await callFunction('getMyFeedback');
        const result = res.result || {};
        const rawList = result.success ? (result.list || []) : [];
        // 预处理媒体类型
        const list = rawList.map(item => ({
          ...item,
          media: (item.media || []).map(url => ({
            url,
            type: /\.(mp4|mov|m4v|avi|webm)$/i.test(url) ? 'video' : 'image'
          }))
        }));
        this.setData({ list, loading: false });
      } catch (err) {
        console.error('加载反馈记录失败:', err);
        this.setData({ list: [], loading: false });
        wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      }
    },

    /** 预览媒体：图片用 previewImage，视频先转临时链接再 previewMedia */
    async previewMedia(e) {
      const { url, type } = e.currentTarget.dataset;
      if (!url) return;

      if (type === 'video') {
        let videoUrl = url;
        if (url.indexOf('cloud://') === 0) {
          wx.showLoading({ title: '加载中…' });
          try {
            const res = await wx.cloud.getTempFileURL({ fileList: [url] });
            const item = res.fileList && res.fileList[0];
            videoUrl = (item && item.tempFileURL) || '';
          } catch (err) {
            console.error('获取视频链接失败:', err.errMsg || err);
          }
          wx.hideLoading();
          if (!videoUrl) {
            wx.showToast({ title: '视频加载失败', icon: 'none' });
            return;
          }
        }
        wx.previewMedia({
          sources: [{ url: videoUrl, type: 'video' }],
          current: 0,
          fail: (err) => {
            console.error('预览视频失败:', err.errMsg || err);
            wx.showToast({ title: '预览失败', icon: 'none' });
          }
        });
      } else {
        wx.previewImage({ urls: [url], current: url });
      }
    },

    goFeedback() {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.navigateTo({ url: '/pages/feedback/feedback' });
        }
      });
    }
  }
});
