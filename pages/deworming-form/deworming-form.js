const { getPet, updatePet } = require('../../utils/storage');

Component({
  data: {
    isEdit: false,
    petId: '',
    form: { type: '体内', medicine: '', date: '', nextDate: '' },
    showDatePicker: false,
    dateField: 'date',
    years: [], months: [], days: [],
    datePickerValue: [0, 0, 0],
    saving: false
  },

  methods: {
    onLoad(options) {
      const opts = options || {};
      const type = opts.type || '体内';
      this.setData({ petId: opts.petId || '', 'form.type': type });
    },

    onFieldInput(e) {
      const field = e.currentTarget.dataset.field;
      this.setData({ ['form.' + field]: e.detail.value });
    },

    showDatePicker(e) {
      const field = e.currentTarget.dataset.field;
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
        dateField: field,
        showDatePicker: true
      });
    },

    hideDatePicker() { this.setData({ showDatePicker: false }); },
    onDateChange(e) { this.setData({ datePickerValue: e.detail.value }); },

    confirmDate() {
      const { years, months, days, datePickerValue, dateField } = this.data;
      const y = years[datePickerValue[0]];
      const m = String(months[datePickerValue[1]]).padStart(2, '0');
      const d = String(days[datePickerValue[2]]).padStart(2, '0');
      this.setData({ ['form.' + dateField]: y + '-' + m + '-' + d, showDatePicker: false });
    },

    async saveRecord() {
      const { form, petId, saving } = this.data;
      if (saving) return;

      if (!form.medicine.trim()) {
        wx.showToast({ title: '请输入用药名称', icon: 'none' });
        return;
      }
      if (!form.date) {
        wx.showToast({ title: '请选择用药日期', icon: 'none' });
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
          type: form.type,
          medicine: form.medicine.trim(),
          date: form.date,
          nextDate: form.nextDate || ''
        };

        const records = pet.dewormingRecords || [];
        records.push(newRecord);

        await updatePet(petId, { dewormingRecords: records });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('保存驱虫记录失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    }
  }
});
