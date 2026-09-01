const { formatDate } = require('../../utils/util');
const { getPets, addDiary } = require('../../utils/storage');

/** 根据文件名后缀判断媒体类型 */
function mediaTypeOf(url) {
  return /\.(mp4|mov|m4v|avi|webm)$/i.test(url) ? 'video' : 'image';
}

// 视频最长时长（秒）：15s 兼顾记录瞬间与存储/性能
const MAX_VIDEO_DURATION = 15;

Component({
  data: {
    petId: '',
    pets: [],
    form: {
      date: formatDate(new Date()),
      content: '',
      media: [],       // [{ url, type }]
      selectedTags: [],
      customTag: ''
    },
    milestoneTags: ['第一次洗澡', '学会坐下', '绝育日', '第一次出门', '生日派对', '体检日', '打疫苗', '驱虫日', '剪指甲', '其他'],
    showDatePicker: false,
    years: [], months: [], days: [],
    datePickerValue: [0, 0, 0],
    saving: false
  },

  methods: {
    onLoad(options) {
      this._initPets((options || {}).petId || '');
    },

    /** 加载宠物列表；若传入 petId 且在列表内则默认选中 */
    async _initPets(petId) {
      const pets = await getPets();
      let selected = '';
      if (pets.length > 0) {
        const exists = pets.some(p => p._id === petId);
        selected = exists ? petId : '';
        if (!exists && pets.length === 1) {
          // 只有一只宠物时自动选中，减少操作
          selected = pets[0]._id;
        }
      }
      this.setData({ pets, petId: selected });
      if (pets.length === 0) {
        wx.showToast({ title: '请先添加宠物', icon: 'none' });
      }
    },

    /** 选择宠物 */
    selectPet(e) {
      const id = e.currentTarget.dataset.id;
      this.setData({ petId: id });
    },

    onFieldInput(e) {
      const field = e.currentTarget.dataset.field;
      this.setData({ ['form.' + field]: e.detail.value });
    },

    /** 头像加载失败 → 回退 emoji */
    onAvatarError(e) {
      const idx = e.currentTarget.dataset.index;
      this.setData({ ['pets[' + idx + '].avatarUrl']: '' });
    },

    /** 点击预留标签 → 自动填充到自定义输入框 */
    fillTag(e) {
      const tag = e.currentTarget.dataset.tag;
      this.setData({ 'form.customTag': tag });
    },

    chooseFromAlbum() {
      // 限制最多上传 1 个
      if (this.data.form.media.length >= 1) {
        wx.showToast({ title: '最多上传 1 个', icon: 'none' });
        return;
      }
      wx.chooseMedia({
        count: 1,
        mediaType: ['image', 'video'],
        sourceType: ['album'],
        success: (res) => {
          // 相册选择的视频需手动校验时长
          const file = res.tempFiles && res.tempFiles[0];
          if (file && file.duration && file.duration > MAX_VIDEO_DURATION) {
            wx.showToast({ title: '视频最长 ' + MAX_VIDEO_DURATION + ' 秒', icon: 'none' });
            return;
          }
          wx.showLoading({ title: '上传中…' });
          this._uploadMedia(res.tempFiles, 0, []);
        }
      });
    },

    takePhoto() {
      // 限制最多上传 1 个
      if (this.data.form.media.length >= 1) {
        wx.showToast({ title: '最多上传 1 个', icon: 'none' });
        return;
      }
      wx.chooseMedia({
        count: 1,
        mediaType: ['image', 'video'],
        sourceType: ['camera'],
        maxDuration: MAX_VIDEO_DURATION,
        success: (res) => {
          wx.showLoading({ title: '上传中…' });
          this._uploadMedia(res.tempFiles, 0, []);
        }
      });
    },

    _uploadMedia(files, index, uploaded) {
      if (index >= files.length) {
        wx.hideLoading();
        this.setData({ 'form.media': [...this.data.form.media, ...uploaded] });
        return;
      }
      const file = files[index];
      const ext = file.tempFilePath.split('.').pop() || 'jpg';
      const cloudPath = 'diary-media/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      wx.cloud.uploadFile({
        cloudPath,
        filePath: file.tempFilePath,
        success: (uploadRes) => {
          uploaded.push({ url: uploadRes.fileID, type: mediaTypeOf(uploadRes.fileID) });
          this._uploadMedia(files, index + 1, uploaded);
        },
        fail: (err) => {
          console.error('上传媒体失败:', err);
          this._uploadMedia(files, index + 1, uploaded);
        }
      });
    },

    removeMedia(e) {
      const idx = e.currentTarget.dataset.index;
      const media = [...this.data.form.media];
      media.splice(idx, 1);
      this.setData({ 'form.media': media });
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

    async saveDiary() {
      const { form, petId, saving } = this.data;
      if (saving) return;

      if (!petId) {
        wx.showToast({ title: '请先选择宠物', icon: 'none' });
        return;
      }

      if (!form.content.trim()) {
        wx.showToast({ title: '请输入日记内容', icon: 'none' });
        return;
      }

      this.setData({ saving: true });
      wx.showLoading({ title: '保存中…' });

      try {
        const media = (form.media || []).map(m => m.url);
        const hasVideo = (form.media || []).some(m => m.type === 'video');
        // 类型：有视频 → video；有图片 → photo；只有文字 → diary
        const type = media.length === 0 ? 'diary' : (hasVideo ? 'video' : 'photo');
        // 标签：自定义优先，其次预留标签
        const tag = form.customTag.trim() || (form.selectedTags[0] || '');

        await addDiary({
          petId,
          date: form.date,
          content: form.content.trim(),
          media,
          type,
          tag,
          tags: form.selectedTags,
          customTag: form.customTag.trim(),
          createdAt: Date.now()
        });

        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('保存日记失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        this.setData({ saving: false });
      }
    }
  }
});
