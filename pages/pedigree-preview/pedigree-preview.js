const { getPet } = require('../../utils/storage');

Component({
  data: {
    petId: '',
    pet: {},
    pedigree: {},
    hasPedigree: false,
    loaded: false
  },

  pageLifetimes: {
    show() {
      if (this.data.petId) {
        this.loadPedigree(this.data.petId);
      }
    }
  },

  methods: {
    onLoad(options) {
      const petId = (options || {}).petId || '';
      this.setData({ petId });
      this.loadPedigree(petId);
    },

    async loadPedigree(petId) {
      if (!petId) return;

      const pet = await getPet(petId);
      if (!pet) {
        this.setData({ pet: {}, pedigree: {}, hasPedigree: false, loaded: true });
        return;
      }

      const pedigree = pet.pedigreeInfo || {};
      const hasPedigree = !!(pedigree.certNo || pedigree.fatherBreed || pedigree.motherBreed || pedigree.breeder || pedigree.certPhoto);
      this.setData({ pet, pedigree, hasPedigree, loaded: true });
    },

    /** 头像加载失败 → 回退 emoji */
    onAvatarError() {
      this.setData({ 'pet.avatarUrl': '' });
    },

    goBack() {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.navigateTo({ url: '/pages/pet-detail/pet-detail?petId=' + this.data.petId });
        }
      });
    },

    goEdit() {
      if (!this.data.petId) {
        wx.showToast({ title: '宠物信息异常', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/pedigree/pedigree?petId=' + this.data.petId });
    },

    previewPhoto() {
      const url = this.data.pedigree.certPhoto;
      if (!url) return;
      wx.previewImage({ urls: [url], current: url });
    }
  }
});
