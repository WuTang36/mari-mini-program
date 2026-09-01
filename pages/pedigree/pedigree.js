const { getPet, updatePet } = require('../../utils/storage');

const CAT_BREEDS = ['布偶猫', '英短', '美短', '暹罗猫', '波斯猫', '缅因猫', '三花猫', '橘猫', '狸花猫', '德文卷毛猫', '其他猫'];
const DOG_BREEDS = ['金毛', '拉布拉多', '柯基', '柴犬', '泰迪', '比熊', '哈士奇', '萨摩耶', '边牧', '法斗', '其他狗'];

Component({
  data: {
    petId: '',
    form: { certNo: '', fatherBreed: '', motherBreed: '', breeder: '', certPhoto: '' },
    showBreedPicker: false,
    breedField: '',
    breedTab: 'cat',
    breedOptions: CAT_BREEDS,
    saving: false
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
      if (pet && pet.pedigreeInfo) {
        this.setData({ form: { ...pet.pedigreeInfo } });
      }
    },

    onFieldInput(e) {
      const field = e.currentTarget.dataset.field;
      this.setData({ ['form.' + field]: e.detail.value });
    },

    showBreedPicker(e) {
      this.setData({ showBreedPicker: true, breedField: e.currentTarget.dataset.field });
    },
    hideBreedPicker() { this.setData({ showBreedPicker: false }); },

    switchBreedTab(e) {
      const tab = e.currentTarget.dataset.tab;
      this.setData({
        breedTab: tab,
        breedOptions: tab === 'cat' ? CAT_BREEDS : DOG_BREEDS
      });
    },

    selectBreed(e) {
      const breed = e.currentTarget.dataset.breed;
      this.setData({ ['form.' + this.data.breedField]: breed, showBreedPicker: false });
    },

    uploadPhoto() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempPath = res.tempFiles[0].tempFilePath;
          wx.showLoading({ title: '上传中…' });
          const cloudPath = 'pedigree-photos/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.jpg';
          wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath,
            success: (uploadRes) => {
              this.setData({ 'form.certPhoto': uploadRes.fileID });
              wx.hideLoading();
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('上传血统证书失败:', err);
              wx.showToast({ title: '上传失败，请重试', icon: 'none' });
            }
          });
        }
      });
    },

    async saveRecord() {
      const { form, petId, saving } = this.data;
      if (saving) return;

      // 必填校验：证书编号、父亲品种、母亲品种
      if (!(form.certNo || '').trim()) {
        wx.showToast({ title: '请填写证书编号', icon: 'none' });
        return;
      }
      if (!form.fatherBreed) {
        wx.showToast({ title: '请选择父亲品种', icon: 'none' });
        return;
      }
      if (!form.motherBreed) {
        wx.showToast({ title: '请选择母亲品种', icon: 'none' });
        return;
      }

      this.setData({ saving: true });
      wx.showLoading({ title: '保存中…' });

      try {
        await updatePet(petId, { pedigreeInfo: form });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('保存血统信息失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    }
  }
});
