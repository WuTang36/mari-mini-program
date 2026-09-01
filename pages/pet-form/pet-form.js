const app = getApp();
const { getPet, addPet, updatePet } = require('../../utils/storage');

const CAT_BREEDS = ['布偶猫', '英短', '美短', '暹罗猫', '波斯猫', '缅因猫', '三花猫', '橘猫', '狸花猫', '德文卷毛猫', '其他（自定义）'];
const DOG_BREEDS = ['金毛', '拉布拉多', '柯基', '柴犬', '泰迪', '比熊', '哈士奇', '萨摩耶', '边牧', '法斗', '其他（自定义）'];
const OTHER_BREEDS = ['兔子', '仓鼠', '龙猫', '鹦鹉', '乌龟', '其他（自定义）'];

Component({
  data: {
    isEdit: false,
    editPetId: '',
    form: {
      name: '',
      breed: '',
      gender: '',
      birthday: '',
      birthdayDisplay: '',
      birthdayUnknown: false,
      birthdayEstimate: false,
      birthdayEstimateAge: '',
      weight: '',
      avatarUrl: ''
    },
    showBreedSheet: false,
    showDatePicker: false,
    showAvatarSheet: false,
    showCustomBreedDialog: false,
    customBreedInput: '',
    breedTab: 'cat',
    breedOptions: CAT_BREEDS,
    years: [],
    months: [],
    days: [],
    datePickerValue: [0, 0, 0],
    saving: false
  },

  lifetimes: {
    attached() {
      if (!this._isLoggedIn()) {
        wx.showModal({
          title: '请先登录',
          content: '添加宠物前需要登录，是否前往登录？',
          confirmText: '去登录',
          cancelText: '返回',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/mine/mine' });
            } else {
              wx.navigateBack({ delta: 1 });
            }
          }
        });
        return;
      }

      this._initFromQuery();
    }
  },

  pageLifetimes: {
    show() {
      if (!this._queryResolved) {
        this._initFromQuery();
      }
    }
  },

  methods: {
    _isLoggedIn() {
      const info = app.globalData.userInfo || {};
      return !!info.nickName;
    },

    _initFromQuery() {
      const pages = getCurrentPages();
      const options = (pages[pages.length - 1] || {}).options || {};
      const petId = options.petId;
      if (petId) {
        this._queryResolved = true;
        this.setData({ isEdit: true, editPetId: petId });
        this.loadPet(petId);
      }
    },

    async loadPet(petId) {
      try {
        const pet = await getPet(petId);
        if (pet) {
          const birthdayUnknown = !pet.birthday && !pet.birthdayEstimateAge;
          const birthdayEstimate = !!pet.birthdayEstimateAge;
          this.setData({
            form: {
              name: pet.name || '',
              breed: pet.breed || '',
              gender: pet.gender || '',
              birthday: pet.birthday || '',
              birthdayDisplay: birthdayUnknown ? '未知' : (birthdayEstimate ? '估算年龄' : (pet.birthday || '')),
              birthdayUnknown: birthdayUnknown,
              birthdayEstimate: birthdayEstimate,
              birthdayEstimateAge: pet.birthdayEstimateAge || '',
              weight: pet.weight || '',
              avatarUrl: (pet.avatarUrl && pet.avatarUrl.startsWith('cloud://')) ? pet.avatarUrl : ''
            }
          });
        }
      } catch (err) {
        console.error('加载宠物失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    onNameInput(e) {
      this.setData({ 'form.name': e.detail.value });
    },

    onWeightInput(e) {
      let val = e.detail.value;
      if (val < 0) val = '';
      if (val.includes('.')) {
        const parts = val.split('.');
        if (parts[1] && parts[1].length > 2) {
          val = parseFloat(val).toFixed(2);
        }
      }
      this.setData({ 'form.weight': val });
    },

    selectGender(e) {
      this.setData({ 'form.gender': e.currentTarget.dataset.gender });
    },

    // 品种选择
    showBreedSheet() {
      this.setData({ showBreedSheet: true });
    },

    hideBreedSheet() {
      this.setData({ showBreedSheet: false });
    },

    switchBreedTab(e) {
      const tab = e.currentTarget.dataset.tab;
      let breedOptions = CAT_BREEDS;
      if (tab === 'dog') breedOptions = DOG_BREEDS;
      else if (tab === 'other') breedOptions = OTHER_BREEDS;
      this.setData({ breedTab: tab, breedOptions });
    },

    selectBreed(e) {
      const breed = e.currentTarget.dataset.breed;
      if (breed === '其他（自定义）') {
        this.setData({ showCustomBreedDialog: true, customBreedInput: '' });
      } else {
        this.setData({ 'form.breed': breed, showBreedSheet: false });
      }
    },

    onCustomBreedInput(e) {
      this.setData({ customBreedInput: e.detail.value });
    },

    confirmCustomBreed() {
      const val = (this.data.customBreedInput || '').trim();
      if (!val) {
        wx.showToast({ title: '请输入品种名称', icon: 'none' });
        return;
      }
      this.setData({ 'form.breed': val, showCustomBreedDialog: false });
    },

    cancelCustomBreed() {
      this.setData({ showCustomBreedDialog: false });
    },

    // 日期选择 — 合并 init + show 到一次 setData
    showDatePicker() {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      const years = [];
      const months = [];
      const days = [];
      for (let y = currentYear; y >= 2010; y--) years.push(y);
      for (let m = 1; m <= 12; m++) months.push(m);
      for (let d = 1; d <= 31; d++) days.push(d);

      const yearIdx = years.indexOf(currentYear);
      const monthIdx = currentMonth - 1;
      const dayIdx = currentDay - 1;

      this.setData({
        years,
        months,
        days,
        datePickerValue: [yearIdx >= 0 ? yearIdx : 0, monthIdx, dayIdx],
        showDatePicker: true
      });
    },

    hideDatePicker() {
      this.setData({ showDatePicker: false });
    },

    onDateChange(e) {
      this.setData({ datePickerValue: e.detail.value });
    },

    confirmDate() {
      const { years, months, days, datePickerValue } = this.data;
      const y = years[datePickerValue[0]];
      const m = months[datePickerValue[1]];
      const d = days[datePickerValue[2]];
      const dateStr = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      this.setData({
        'form.birthday': dateStr,
        'form.birthdayDisplay': dateStr,
        'form.birthdayUnknown': false,
        'form.birthdayEstimate': false,
        'form.birthdayEstimateAge': '',
        showDatePicker: false
      });
    },

    setUnknownBirthday() {
      const isActive = !this.data.form.birthdayUnknown;
      this.setData({
        'form.birthdayUnknown': isActive,
        'form.birthdayEstimate': false,
        'form.birthdayEstimateAge': '',
        'form.birthdayDisplay': isActive ? '未知' : '',
        'form.birthday': isActive ? '' : ''
      });
    },

    setEstimateAge() {
      const isActive = !this.data.form.birthdayEstimate;
      this.setData({
        'form.birthdayEstimate': isActive,
        'form.birthdayUnknown': false,
        'form.birthday': '',
        'form.birthdayDisplay': isActive ? '估算年龄' : ''
      });
    },

    onEstimateAgeInput(e) {
      let val = parseInt(e.detail.value) || 0;
      if (val < 0) val = 0;
      if (val > 50) val = 50;
      this.setData({ 'form.birthdayEstimateAge': val });
    },

    /** 头像加载失败 → 清空回退占位 */
    onAvatarError() {
      this.setData({ 'form.avatarUrl': '' });
    },

    // 头像
    showAvatarSheet() {
      this.setData({ showAvatarSheet: true });
    },

    hideAvatarSheet() {
      this.setData({ showAvatarSheet: false });
    },

    takePhoto() {
      this.setData({ showAvatarSheet: false });
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: (res) => {
          this._uploadAvatar(res.tempFiles[0].tempFilePath);
        }
      });
    },

    chooseFromAlbum() {
      this.setData({ showAvatarSheet: false });
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res) => {
          this._uploadAvatar(res.tempFiles[0].tempFilePath);
        }
      });
    },

    _uploadAvatar(tempPath) {
      wx.showLoading({ title: '上传中...' });
      const cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.jpg';
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempPath,
        success: (res) => {
          this.setData({ 'form.avatarUrl': res.fileID });
          wx.hideLoading();
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('头像上传失败:', err);
          wx.showToast({ title: '头像上传失败，请重试', icon: 'none' });
        }
      });
    },

    // 保存
    async savePet() {
      const { form, isEdit, editPetId, saving } = this.data;
      if (saving) return;

      const name = (form.name || '').trim();
      if (!name) {
        wx.showToast({ title: '请输入宠物名字', icon: 'none' });
        return;
      }
      if (!form.breed) {
        wx.showToast({ title: '请选择品种', icon: 'none' });
        return;
      }
      if (!form.gender) {
        wx.showToast({ title: '请选择性别', icon: 'none' });
        return;
      }

      this.setData({ saving: true });
      wx.showLoading({ title: '保存中...' });

      const petData = {
        name: name,
        breed: form.breed,
        gender: form.gender,
        birthday: form.birthdayUnknown || form.birthdayEstimate ? '' : form.birthday,
        birthdayUnknown: form.birthdayUnknown,
        birthdayEstimate: form.birthdayEstimate,
        birthdayEstimateAge: form.birthdayEstimate ? (form.birthdayEstimateAge || 0) : 0,
        avatarUrl: form.avatarUrl || '',
        weight: form.weight || '',
        updatedAt: new Date().toISOString()
      };

      try {
        if (isEdit) {
          await updatePet(editPetId, petData);
        } else {
          petData.createdAt = new Date().toISOString();
          await addPet(petData);
        }
        wx.hideLoading();
        wx.showToast({ title: isEdit ? '修改成功' : '添加成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } catch (err) {
        wx.hideLoading();
        console.error('保存失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    }
  }
});
