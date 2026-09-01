const { getPet } = require('../../utils/storage');
const { formatDate } = require('../../utils/util');

Component({
  data: {
    petId: '',
    internalRecords: [],
    externalRecords: [],
    showAddSheet: false
  },

  pageLifetimes: {
    show() {
      this.loadRecords();
    }
  },

  methods: {
    onLoad(options) {
      this.setData({ petId: (options || {}).petId || '' });
      this.loadRecords();
    },

    async loadRecords() {
      const petId = this.data.petId;
      if (!petId) return;

      const pet = await getPet(petId);
      if (!pet) {
        this.setData({ internalRecords: [], externalRecords: [] });
        return;
      }

      const today = formatDate(new Date());

      const classify = (recs) => recs.map(r => {
        let status = 'normal', statusText = '正常';
        if (r.nextDate && r.nextDate < today) {
          status = 'expired'; statusText = '已过期';
        } else if (r.nextDate && r.nextDate === today) {
          status = 'warning'; statusText = '今日到期';
        }
        return { ...r, status, statusText };
      }).sort((a, b) => b.date.localeCompare(a.date));

      const all = pet.dewormingRecords || [];
      const internalRecords = classify(all.filter(r => r.type === '体内'));
      const externalRecords = classify(all.filter(r => r.type === '体外'));

      this.setData({ internalRecords, externalRecords });
    },

    showAddSheet() {
      this.setData({ showAddSheet: true });
    },

    hideAddSheet() {
      this.setData({ showAddSheet: false });
    },

    addDeworming(e) {
      const type = e.currentTarget.dataset.type;
      this.setData({ showAddSheet: false });
      const petId = this.data.petId;
      if (!petId) {
        wx.showToast({ title: '宠物信息异常', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/deworming-form/deworming-form?petId=' + petId + '&type=' + type });
    }
  }
});
