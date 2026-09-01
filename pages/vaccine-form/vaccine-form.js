const { getPet, updatePet, getSubscribeStatus, setSubscribeStatus } = require('../../utils/storage');
const VACCINE_OPTIONS = ['猫三联', '犬六联', '狂犬疫苗', '猫四联', '犬八联', '其他'];

// 订阅消息模板 ID（与提醒中心 / 云函数 sendReminder 保持一致）
const SUBSCRIBE_TEMPLATE_IDS = [
  'DG-B5rqPc65CeE8eo0JjcdNrQd90dc9wakSo5auDZ7U',
  'n2U04kHIkdjq_vz4fxYnmqnEVOx6xVAD37debwkw6Uk'
];

Component({
  data: {
    isEdit: false,
    petId: '',
    form: {
      name: '',
      date: '',
      nextDate: '',
      batchNo: '',
      clinic: '',
      photoUrl: ''
    },
    showVaccinePicker: false,
    showDatePicker: false,
    showCustomVaccineDialog: false,
    customVaccineInput: '',
    showSubscribeGuide: false,
    dateField: 'date',
    vaccineOptions: VACCINE_OPTIONS,
    years: [],
    months: [],
    days: [],
    datePickerValue: [0, 0, 0],
    saving: false
  },

  methods: {
    onLoad(options) {
      this.setData({ petId: (options || {}).petId || '' });
    },

    showVaccinePicker() { this.setData({ showVaccinePicker: true }); },
    hideVaccinePicker() { this.setData({ showVaccinePicker: false }); },

    selectVaccine(e) {
      const name = e.currentTarget.dataset.name;
      if (name === '其他') {
        this.setData({ showCustomVaccineDialog: true, customVaccineInput: '' });
      } else {
        this.setData({ 'form.name': name, showVaccinePicker: false });
        this.calcNextDate();
      }
    },

    onCustomVaccineInput(e) {
      this.setData({ customVaccineInput: e.detail.value });
    },

    confirmCustomVaccine() {
      const val = (this.data.customVaccineInput || '').trim();
      if (!val) {
        wx.showToast({ title: '请输入疫苗名称', icon: 'none' });
        return;
      }
      this.setData({ 'form.name': val, showCustomVaccineDialog: false, showVaccinePicker: false });
      this.calcNextDate();
    },

    cancelCustomVaccine() {
      this.setData({ showCustomVaccineDialog: false });
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

    onDateChange(e) {
      this.setData({ datePickerValue: e.detail.value });
    },

    confirmDate() {
      const { years, months, days, datePickerValue, dateField } = this.data;
      const y = years[datePickerValue[0]];
      const m = String(months[datePickerValue[1]]).padStart(2, '0');
      const d = String(days[datePickerValue[2]]).padStart(2, '0');
      const dateStr = y + '-' + m + '-' + d;

      const update = {};
      update['form.' + dateField] = dateStr;
      this.setData({ ...update, showDatePicker: false });
      this.calcNextDate();
    },

    calcNextDate() {
      const { name, date } = this.data.form;
      if (!name || !date) return;
      const d = new Date(date.replace(/-/g, '/'));
      d.setFullYear(d.getFullYear() + 1);
      const nextY = d.getFullYear();
      const nextM = String(d.getMonth() + 1).padStart(2, '0');
      const nextD = String(d.getDate()).padStart(2, '0');
      this.setData({ 'form.nextDate': nextY + '-' + nextM + '-' + nextD });
    },

    onFieldInput(e) {
      const field = e.currentTarget.dataset.field;
      const update = {};
      update['form.' + field] = e.detail.value;
      this.setData(update);
    },

    uploadPhoto() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempPath = res.tempFiles[0].tempFilePath;
          wx.showLoading({ title: '上传中…' });
          const cloudPath = 'vaccine-photos/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.jpg';
          wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath,
            success: (uploadRes) => {
              this.setData({ 'form.photoUrl': uploadRes.fileID });
              wx.hideLoading();
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('上传疫苗本照片失败:', err);
              wx.showToast({ title: '上传失败，请重试', icon: 'none' });
            }
          });
        }
      });
    },

    async saveRecord() {
      const { form, petId, saving } = this.data;
      if (saving) return;

      if (!form.name) {
        wx.showToast({ title: '请选择疫苗名称', icon: 'none' });
        return;
      }
      if (!form.date) {
        wx.showToast({ title: '请选择接种日期', icon: 'none' });
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
          name: form.name,
          date: form.date,
          nextDate: form.nextDate || '',
          batchNo: form.batchNo || '',
          clinic: form.clinic || '',
          photoUrl: form.photoUrl || ''
        };

        const records = pet.vaccineRecords || [];
        records.push(newRecord);

        await updatePet(petId, { vaccineRecords: records });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ saving: false });

        // 保存成功 → 未订阅用户弹出订阅引导
        const subscribed = await getSubscribeStatus();
        if (subscribed) {
          setTimeout(() => wx.navigateBack(), 1000);
        } else {
          this.setData({ showSubscribeGuide: true });
        }
      } catch (err) {
        wx.hideLoading();
        console.error('保存疫苗记录失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    },

    /** 订阅引导：去订阅 */
    subscribeGuideSubscribe() {
      const tmplIds = SUBSCRIBE_TEMPLATE_IDS;
      wx.requestSubscribeMessage({
        tmplIds,
        success: (res) => {
          const accepted = tmplIds.some(id => res[id] === 'accept');
          if (accepted) {
            setSubscribeStatus(true);
            wx.showToast({ title: '订阅成功', icon: 'success' });
          } else {
            setSubscribeStatus(false);
            wx.showToast({ title: '已取消订阅', icon: 'none' });
          }
          this.setData({ showSubscribeGuide: false });
          setTimeout(() => wx.navigateBack(), 800);
        },
        fail: (err) => {
          console.error('订阅失败:', err.errMsg || err);
          this.setData({ showSubscribeGuide: false });
          setTimeout(() => wx.navigateBack(), 800);
        }
      });
    },

    /** 订阅引导：跳过 */
    skipSubscribeGuide() {
      this.setData({ showSubscribeGuide: false });
      setTimeout(() => wx.navigateBack(), 300);
    }
  }
});
