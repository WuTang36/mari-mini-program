const { getPet, updatePet } = require('../../utils/storage');

Component({
  data: {
    form: { weight: '', date: '' },
    showDatePicker: false,
    years: [], months: [], days: [],
    datePickerValue: [0, 0, 0]
  },

  pageLifetimes: {
    show() {
      // 首次 show 时初始化
      if (!this._initDone) {
        this._initDone = true;
        this.initDatePicker();
      }
      // 获取 query 参数（show 时页面已入栈）
      if (!this._petId) {
        const pages = getCurrentPages();
        const page = pages[pages.length - 1];
        const options = (page && page.options) || {};
        this._petId = options.petId || '';
      }
    }
  },

  methods: {
    initDatePicker() {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1;
      const curDay = now.getDate();

      const years = [], months = [], days = [];
      for (let y = curYear; y >= 2010; y--) years.push(y);
      for (let m = 1; m <= 12; m++) months.push(m);
      for (let d = 1; d <= 31; d++) days.push(d);

      this.setData({
        years, months, days,
        datePickerValue: [years.indexOf(curYear), curMonth - 1, curDay - 1],
        'form.date': curYear + '-' + String(curMonth).padStart(2, '0') + '-' + String(curDay).padStart(2, '0')
      });
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

    showDatePicker() { this.setData({ showDatePicker: true }); },
    hideDatePicker() { this.setData({ showDatePicker: false }); },
    onDateChange(e) { this.setData({ datePickerValue: e.detail.value }); },

    confirmDate() {
      const { years, months, days, datePickerValue } = this.data;
      const y = years[datePickerValue[0]];
      const m = String(months[datePickerValue[1]]).padStart(2, '0');
      const d = String(days[datePickerValue[2]]).padStart(2, '0');
      this.setData({ 'form.date': y + '-' + m + '-' + d, showDatePicker: false });
    },

    async saveRecord() {
      if (!this.data.form.weight || parseFloat(this.data.form.weight) <= 0) {
        wx.showToast({ title: '请输入有效体重', icon: 'none' });
        return;
      }
      if (!this.data.form.date) {
        wx.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }

      // 兜底：如果 show 还没拿到 petId，再尝试一次
      if (!this._petId) {
        const pages = getCurrentPages();
        const page = pages[pages.length - 1];
        const options = (page && page.options) || {};
        this._petId = options.petId || '';
      }

      if (!this._petId) {
        wx.showToast({ title: '参数异常，请返回重试', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '保存中…' });

      try {
        const pet = await getPet(this._petId);
        if (!pet) {
          wx.hideLoading();
          wx.showToast({ title: '宠物不存在', icon: 'none' });
          return;
        }

        const newRecord = {
          date: this.data.form.date,
          weight: parseFloat(this.data.form.weight)
        };

        const existing = pet.weightRecords || [];
        const idx = existing.findIndex(r => r.date === newRecord.date);
        if (idx >= 0) {
          existing[idx] = newRecord;
        } else {
          existing.push(newRecord);
        }
        const weightRecords = existing;
        await updatePet(this._petId, { weightRecords });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('保存体重失败:', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
