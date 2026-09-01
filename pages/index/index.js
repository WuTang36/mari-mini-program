const app = getApp();
const { calcAge, formatDate } = require('../../utils/util');
const { getPets, getReminders } = require('../../utils/storage');

Component({
  data: {
    pets: [],
    unreadCount: 0,
    swipedPetId: '',
    showDeleteDialog: false,
    deletePetId: '',
    deleting: false
  },

  lifetimes: {
    attached() {
      this.loadData();
    }
  },

  pageLifetimes: {
    show() {
      this.loadData();
    }
  },

  methods: {
    /** 检查是否已登录（有头像+昵称） */
    _isLoggedIn() {
      const info = app.globalData.userInfo || {};
      return !!(info.nickName && info.avatarUrl);
    },

    /** 引导登录弹窗 */
    _requireLogin(callback) {
      if (this._isLoggedIn()) {
        if (callback) callback();
        return true;
      }
      wx.showModal({
        title: '请先登录',
        content: '添加宠物前需要登录，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/mine/mine' });
          }
        }
      });
      return false;
    },

    async loadData() {
      try {
        const pets = await getPets();
        const today = formatDate(new Date());

        const enrichedPets = pets.map(p => {
          const ageText = calcAge(p.birthday, p.birthdayEstimateAge);
          const hasVaccineWarning = (p.vaccineRecords || []).some(v => v.nextDate && v.nextDate <= today);
          const hasDewormWarning = (p.dewormingRecords || []).some(d => d.nextDate && d.nextDate <= today);
          // 过滤无效头像：只保留 cloud:// 开头的云存储链接
          const safeAvatarUrl = (p.avatarUrl && p.avatarUrl.startsWith('cloud://')) ? p.avatarUrl : '';
          return { ...p, avatarUrl: safeAvatarUrl, ageText, hasVaccineWarning, hasDewormWarning };
        });
        this.setData({ pets: enrichedPets });

        // 统计未读提醒数
        const reminders = await getReminders();
        const unreadCount = reminders.filter(r => !r.read).length;
        this.setData({ unreadCount });
      } catch (err) {
        console.error('加载宠物列表失败:', err);
      }
    },

    /** 头像加载失败 → 回退 emoji */
    onAvatarError(e) {
      const idx = e.currentTarget.dataset.index;
      this.setData({ ['pets[' + idx + '].avatarUrl']: '' });
    },

    // 左滑手势
    onTouchStart(e) {
      const id = e.currentTarget.dataset.id;
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this._swipedId = id;
    },

    onTouchMove(e) {
      const id = e.currentTarget.dataset.id;
      if (id !== this._swipedId) return;

      const moveX = e.touches[0].clientX - this._touchStartX;
      const moveY = e.touches[0].clientY - this._touchStartY;

      if (Math.abs(moveY) > Math.abs(moveX) * 0.6) return;

      if (moveX < -20) {
        // 左滑：露出删除按钮
        this.setData({ swipedPetId: id });
      } else if (moveX > 20) {
        // 右滑：收起删除按钮
        this.setData({ swipedPetId: '' });
      }
    },

    onTouchEnd() {
      // 保持当前滑动状态（由 onTouchMove 实时更新）
    },

    hideSwipe() {
      this.setData({ swipedPetId: '' });
    },

    // 删除宠物：弹出警示选择弹窗
    onDeletePet(e) {
      const id = e.currentTarget.dataset.id;
      this.setData({ showDeleteDialog: true, deletePetId: id });
    },

    /** 关闭删除弹窗 */
    cancelDelete() {
      this.setData({ showDeleteDialog: false, deletePetId: '', swipedPetId: '' });
    },

    /** 仅删除宠物（保留日记） */
    deletePetOnly() {
      this._doDelete(false);
    },

    /** 删除宠物及全部日记 */
    deletePetWithDiaries() {
      this._doDelete(true);
    },

    async _doDelete(deleteDiaries) {
      const { deletePetId, deleting } = this.data;
      if (!deletePetId || deleting) return;

      this.setData({ deleting: true });
      wx.showLoading({ title: '删除中…' });

      try {
        const { callFunction } = require('../../utils/cloud');
        const res = await callFunction('deletePetData', {
          petId: deletePetId,
          mode: deleteDiaries ? 'petAndDiaries' : 'petOnly',
          deleteDiaries: !!deleteDiaries
        });
        const result = res.result || {};
        if (!result.success) {
          throw new Error(result.errMsg || '删除失败');
        }
        console.log('[deletePetData] 删除成功，返回=', JSON.stringify(result));

        wx.hideLoading();
        this.setData({ showDeleteDialog: false, deletePetId: '', swipedPetId: '', deleting: false });
        wx.showToast({ title: deleteDiaries ? '已删除宠物及日记' : '已删除', icon: 'success' });
        this.loadData();
      } catch (err) {
        wx.hideLoading();
        console.error('删除失败:', err);
        const msg = (err && err.message) || '删除失败，请重试';
        wx.showModal({
          title: '删除失败',
          content: msg.length > 60 ? msg.slice(0, 60) + '…' : msg,
          showCancel: false
        });
        this.setData({ deleting: false });
      }
    },

    goReminderCenter() {
      wx.navigateTo({ url: '/pages/reminder-center/reminder-center' });
    },

    goPetDetail(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({ url: '/pages/pet-detail/pet-detail?petId=' + id });
    },

    /** 添加宠物：必须登录 */
    addPet() {
      this._requireLogin(() => {
        wx.navigateTo({ url: '/pages/pet-form/pet-form' });
      });
    }
  }
});
