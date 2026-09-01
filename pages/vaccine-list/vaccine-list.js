const { getPet } = require('../../utils/storage');
const { formatDate } = require('../../utils/util');

Component({
  data: {
    petId: '',
    records: []
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
        this.setData({ records: [] });
        return;
      }

      const today = formatDate(new Date());

      const records = (pet.vaccineRecords || []).map((r, i) => {
        let status = 'normal';
        let statusText = '正常';
        if (r.nextDate && r.nextDate < today) {
          status = 'expired';
          statusText = '已过期';
        } else if (r.nextDate && r.nextDate <= today) {
          status = 'warning';
          statusText = '即将到期';
        }
        return { ...r, id: r._id || ('v_' + i), status, statusText };
      }).sort((a, b) => b.date.localeCompare(a.date));

      this.setData({ records });
    },

    previewPhoto(e) {
      const url = e.currentTarget.dataset.url;
      if (!url) return;
      wx.previewImage({
        urls: [url],
        current: url
      });
    },

    addRecord() {
      const petId = this.data.petId;
      if (!petId) {
        wx.showToast({ title: '宠物信息异常', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/vaccine-form/vaccine-form?petId=' + petId });
    }
  }
});
