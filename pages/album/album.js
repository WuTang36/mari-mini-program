const { getPets, getDeletedPets, getDiaries } = require('../../utils/storage');
const { groupByMonth } = require('../../utils/util');

const PAGE_SIZE = 20;

Component({
  data: {
    pets: [],
    selectedPetId: '',
    filters: ['全部', '照片', '视频', '日记'],
    currentFilter: '全部',
    allDiaries: [],
    groupedDiaries: [],
    page: 0,
    pageSize: PAGE_SIZE,
    hasMore: true,
    loading: false
  },

  lifetimes: {
    attached() {
      this.loadPets();
    }
  },

  pageLifetimes: {
    show() {
      // 刷新宠物列表（被删除宠物的 Tab 消失）并重载日记
      this.loadPets();
    }
  },

  methods: {
    async loadPets() {
      // 档案宠物 + 已删除但保留日记的宠物（归档），合并为相册 Tab
      const [pets, deletedPets] = await Promise.all([getPets(), getDeletedPets()]);
      const all = [...pets, ...deletedPets];
      this.setData({ pets: all });
      // 当前选中宠物不存在时重置为第一只
      let selected = this.data.selectedPetId;
      if (all.length > 0) {
        if (!all.some(p => p._id === selected)) {
          selected = all[0]._id;
        }
      } else {
        selected = '';
      }
      this.setData({ selectedPetId: selected });
      this.loadDiaries(true);
    },

    selectPet(e) {
      const id = e.currentTarget.dataset.id;
      // 切换宠物后类型筛选重置为「全部」
      this.setData({ selectedPetId: id, currentFilter: '全部' });
      this.loadDiaries(true);
    },

    setFilter(e) {
      const filter = e.currentTarget.dataset.filter;
      this.setData({ currentFilter: filter });
      this.loadDiaries(true);
    },

    /** 加载日记；reset=true 时从第一页重新加载 */
    async loadDiaries(reset = true) {
      const { selectedPetId, currentFilter, pageSize, loading } = this.data;
      if (!selectedPetId || loading) return;

      const page = reset ? 0 : this.data.page;
      this.setData({ loading: true });
      if (reset) {
        this.setData({ allDiaries: [], page: 0, hasMore: true });
      }

      const list = await getDiaries(selectedPetId, page * pageSize, pageSize);

      // 竞态保护：期间页面被重置则丢弃本次结果
      if (this.data.page !== page) {
        this.setData({ loading: false });
        return;
      }

      const all = reset ? list : [...this.data.allDiaries, ...list];
      // 最新发布的日记排在最前：日期降序，同一天按创建时间降序
      const sorted = all.slice().sort((a, b) => {
        const dateCmp = (b.date || '').localeCompare(a.date || '');
        if (dateCmp !== 0) return dateCmp;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      // 中文筛选 → 日记 type（photo/video/diary）
      const typeMap = { '照片': 'photo', '视频': 'video', '日记': 'diary' };
      const filterType = typeMap[currentFilter];
      const filtered = filterType
        ? sorted.filter(d => d.type === filterType)
        : sorted;
      const hasMore = list.length === pageSize;

      this.setData({
        allDiaries: sorted,
        groupedDiaries: groupByMonth(filtered, 'date'),
        hasMore,
        page: page + 1,
        loading: false
      });

      // 异步解析视频首帧封面
      this._resolveVideoCovers();
    },

    /** 把视频 cloud:// 转成临时 https 链接作为首帧封面 */
    async _resolveVideoCovers() {
      const list = this.data.allDiaries;
      if (!list || !list.length) return;

      const targets = [];
      list.forEach((d, i) => {
        if (d.type === 'video' && d.media && d.media[0] &&
            d.media[0].indexOf('cloud://') === 0 && !d.videoUrl) {
          targets.push({ index: i, fileID: d.media[0] });
        }
      });
      if (!targets.length) return;

      try {
        const res = await wx.cloud.getTempFileURL({ fileList: targets.map(t => t.fileID) });
        const patch = {};
        res.fileList.forEach((item, k) => {
          if (item.tempFileURL && targets[k]) {
            patch['allDiaries[' + targets[k].index + '].videoUrl'] = item.tempFileURL;
          }
        });
        if (!Object.keys(patch).length) return;
        this.setData(patch);

        // 同步刷新分组，让封面即时生效
        const { currentFilter } = this.data;
        const typeMap = { '照片': 'photo', '视频': 'video', '日记': 'diary' };
        const filterType = typeMap[currentFilter];
        const filtered = filterType
          ? this.data.allDiaries.filter(d => d.type === filterType)
          : this.data.allDiaries;
        this.setData({ groupedDiaries: groupByMonth(filtered, 'date') });
      } catch (err) {
        console.error('获取视频封面失败:', err.errMsg || err);
      }
    },

    /** 上拉加载更多 */
    loadMore() {
      const { selectedPetId, hasMore, loading } = this.data;
      if (!selectedPetId || !hasMore || loading) return;
      this.loadDiaries(false);
    },

    /** 头像加载失败 → 回退 emoji */
    onAvatarError(e) {
      const idx = e.currentTarget.dataset.index;
      this.setData({ ['pets[' + idx + '].avatarUrl']: '' });
    },

    goDiary() {
      if (!this.data.selectedPetId) {
        wx.showToast({ title: '请先选择宠物', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/pages/diary-form/diary-form?petId=' + this.data.selectedPetId });
    },

    /** 预览照片 */
    previewDiaryMedia(e) {
      const url = e.currentTarget.dataset.url;
      if (!url) return;
      wx.previewImage({ urls: [url], current: url });
    },

    /** 预览视频：先把 cloud:// 转成临时 https 链接再播放 */
    async previewDiaryVideo(e) {
      const fileID = e.currentTarget.dataset.url;
      if (!fileID) return;

      let url = fileID;
      if (fileID.indexOf('cloud://') === 0) {
        wx.showLoading({ title: '加载中…' });
        try {
          const res = await wx.cloud.getTempFileURL({ fileList: [fileID] });
          const item = res.fileList && res.fileList[0];
          url = (item && item.tempFileURL) || '';
        } catch (err) {
          console.error('获取视频链接失败:', err.errMsg || err);
        }
        wx.hideLoading();
        if (!url) {
          wx.showToast({ title: '视频加载失败', icon: 'none' });
          return;
        }
      }

      wx.previewMedia({
        sources: [{ url, type: 'video' }],
        current: 0,
        fail: (err) => {
          console.error('预览视频失败:', err.errMsg || err);
          wx.showToast({ title: '预览失败', icon: 'none' });
        }
      });
    }
  }
});
