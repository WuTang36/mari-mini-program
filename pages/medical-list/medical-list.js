const { getPet } = require('../../utils/storage');

const tagColors = {
  '手术': { bg: '#FFEBEE', color: '#C62828' },
  '慢性病': { bg: '#F3E5F5', color: '#6A1B9A' },
  '过敏': { bg: '#FFF3E0', color: '#E65100' },
  '受伤': { bg: '#FFEBEE', color: '#D84315' },
  '其他': { bg: '#ECEFF1', color: '#546E7A' },
  '体检': { bg: '#E8F5E9', color: '#2E7D32' },
  '疾病': { bg: '#F3E5F5', color: '#6A1B9A' }
};

Component({
  data: {
    petId: '',
    pet: {},
    records: []
  },

  pageLifetimes: {
    show() { this.loadData(); }
  },

  methods: {
    onLoad(options) {
      this.setData({ petId: (options || {}).petId || '' });
      this.loadData();
    },

    async loadData() {
      const petId = this.data.petId;
      if (!petId) return;

      const pet = await getPet(petId);
      if (!pet) {
        this.setData({ pet: {}, records: [] });
        return;
      }

      const records = (pet.medicalRecords || []).sort((a, b) => b.date.localeCompare(a.date));
      const enriched = records.map(r => ({
        ...r,
        tagStyle: tagColors[r.tag] ? 'background:' + tagColors[r.tag].bg + ';color:' + tagColors[r.tag].color : 'background:#ECEFF1;color:#546E7A'
      }));
      this.setData({ pet, records: enriched });
    },

    /** 头像加载失败 → 回退 emoji */
    onAvatarError() {
      this.setData({ 'pet.avatarUrl': '' });
    },

    previewPhoto(e) {
      const url = e.currentTarget.dataset.url;
      if (!url) return;
      wx.previewImage({ urls: [url], current: url });
    },

    addRecord() {
      const petId = this.data.petId;
      if (!petId) {
        wx.showToast({ title: '宠物信息异常', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/medical-form/medical-form?petId=' + petId });
    }
  }
});
