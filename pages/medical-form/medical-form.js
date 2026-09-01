const { getPet, updatePet } = require('../../utils/storage');

Component({
  data: {
    petId: '',
    form: { date: '', title: '', tag: '', desc: '', photoUrl: '' },
    tagOptions: ['手术', '慢性病', '过敏', '受伤', '其他'],
    showDatePicker: false,
    years: [], months: [], days: [],
    datePickerValue: [0, 0, 0],
    saving: false
  },

  methods: {
    onLoad(options) {
      this.setData({ petId: (options || {}).petId || '' });
    },

    onFieldInput(e) {
      const field = e.currentTarget.dataset.field;
      this.setData({ ['form.' + field]: e.detail.value });
    },

    selectTag(e) {
      this.setData({ 'form.tag': e.currentTarget.dataset.tag });
    },

    showDatePicker() {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      const years = [], months = [], days = [];
      for (let y = currentYear; y >= 2010; y--) years.push(y);
      for (let m = 1; m <= 12; m++) months.push(m);
      for (let d = 1; d <= 31; d++) days.push(d);

      this.setData({
        years, months, days,
        datePickerValue: [years.indexOf(currentYear), currentMonth - 1, currentDay - 1],
        showDatePicker: true
      });
    },

    hideDatePicker() { this.setData({ showDatePicker: false }); },
    onDateChange(e) { this.setData({ datePickerValue: e.detail.value }); },

    confirmDate() {
      const { years, months, days, datePickerValue } = this.data;
      const y = years[datePickerValue[0]];
      const m = String(months[datePickerValue[1]]).padStart(2, '0');
      const d = String(days[datePickerValue[2]]).padStart(2, '0');
      this.setData({ 'form.date': y + '-' + m + '-' + d, showDatePicker: false });
    },

    uploadPhoto() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempPath = res.tempFiles[0].tempFilePath;
          wx.showLoading({ title: '上传中…' });
          const cloudPath = 'medical-photos/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.jpg';
          wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath,
            success: (uploadRes) => {
              this.setData({ 'form.photoUrl': uploadRes.fileID });
              wx.hideLoading();
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('上传病史照片失败:', err);
              wx.showToast({ title: '上传失败，请重试', icon: 'none' });
            }
          });
        }
      });
    },

    async saveRecord() {
      const { form, petId, saving } = this.data;
      if (saving) return;

      if (!form.date) {
        wx.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }
      if (!form.title.trim()) {
        wx.showToast({ title: '请输入标题', icon: 'none' });
        return;
      }

      this.setData({ saving: true });
      wx.showLoading({ title: '保存中…' });

      try {
        const pet = await getPet(petId);
        if (!pet) {
          wx.hideLoading();
          wx.showToast({ title: '宠物不存在', icon: 'none' });
          this.setData({ saving: false });
          return;
        }

        const newRecord = {
          date: form.date,
          title: form.title.trim(),
          tag: form.tag || '',
          desc: form.desc || '',
          photoUrl: form.photoUrl || ''
        };

        const records = pet.medicalRecords || [];
        records.push(newRecord);

        await updatePet(petId, { medicalRecords: records });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('保存病史记录失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    }
  }
});
