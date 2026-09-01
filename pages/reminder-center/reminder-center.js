const app = getApp();
const { getReminders, markReminderRead, markAllRemindersRead, getSubscribeStatus, setSubscribeStatus } = require('../../utils/storage');

// 订阅消息模板 ID（与云函数 sendReminder 保持一致）
// 疫苗/驱虫到期模板 + 生日提醒模板
const SUBSCRIBE_TEMPLATE_IDS = [
  'DG-B5rqPc65CeE8eo0JjcdNrQd90dc9wakSo5auDZ7U',
  'n2U04kHIkdjq_vz4fxYnmqnEVOx6xVAD37debwkw6Uk'
];

Component({
  data: {
    reminders: [],
    hasUnread: false,
    subscribed: false
  },

  lifetimes: {
    attached() {
      this.loadReminders();
      this.loadSubscribeStatus();
    }
  },

  pageLifetimes: {
    show() {
      this.loadReminders();
      this.loadSubscribeStatus();
    }
  },

  methods: {
    async loadReminders() {
      const reminders = await getReminders();
      const hasUnread = reminders.some(r => !r.read);
      this.setData({ reminders, hasUnread });
    },

    async loadSubscribeStatus() {
      const subscribed = await getSubscribeStatus();
      this.setData({ subscribed });
    },

    toggleRead(e) {
      const id = e.currentTarget.dataset.id;
      const reminders = this.data.reminders.map(r =>
        r.id === id ? { ...r, read: !r.read } : r
      );
      const target = reminders.find(r => r.id === id);
      this.setData({ reminders, hasUnread: reminders.some(r => !r.read) });
      if (target && target.read) {
        markReminderRead(id);
      }
    },

    markAllRead() {
      const ids = this.data.reminders.map(r => r.id);
      const reminders = this.data.reminders.map(r => ({ ...r, read: true }));
      this.setData({ reminders, hasUnread: false });
      markAllRemindersRead(ids);
    },

    subscribeReminder() {
      if (!app.globalData.openid) {
        wx.showModal({
          title: '请先登录',
          content: '登录后才能接收订阅提醒，是否前往登录？',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/mine/mine' });
            }
          }
        });
        return;
      }

      // 一次调用可传多个模板（官方支持最多 3 个），微信会依次弹出授权框
      wx.requestSubscribeMessage({
        tmplIds: SUBSCRIBE_TEMPLATE_IDS,
        success: (res) => {
          const accepted = SUBSCRIBE_TEMPLATE_IDS.some(id => res[id] === 'accept');
          if (accepted) {
            this.setData({ subscribed: true });
            setSubscribeStatus(true);
            wx.showToast({ title: '订阅成功', icon: 'success' });
          } else {
            this.setData({ subscribed: false });
            setSubscribeStatus(false);
            wx.showToast({ title: '已取消订阅', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('订阅失败:', err.errMsg || err);
          wx.showToast({ title: '订阅失败，请重试', icon: 'none' });
        }
      });
    },

    /** 取消订阅 */
    cancelSubscribe() {
      wx.showModal({
        title: '取消订阅',
        content: '取消后将不再接收提醒，确定取消吗？',
        confirmText: '取消订阅',
        confirmColor: '#FF5252',
        success: (res) => {
          if (res.confirm) {
            this.setData({ subscribed: false });
            setSubscribeStatus(false);
            wx.showToast({ title: '已取消订阅', icon: 'none' });
          }
        }
      });
    }
  }
});
