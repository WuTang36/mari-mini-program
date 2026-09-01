const { getPet } = require('../../utils/storage');

Component({
  data: {
    pet: {},
    periods: ['近1月', '近3月', '近6月', '全部'],
    currentPeriod: '全部',
    records: [],
    filteredRecords: [],
    displayRecords: [],
    selectedPoint: null,
    loading: true,
    chartReady: false
  },

  lifetimes: {
    attached() {
      this._resolvePetId();
      this.loadData();
    }
  },

  pageLifetimes: {
    show() {
      // show 时强制刷新（重置 _petId 以应对页面栈变化）
      const prevPetId = this._petId;
      this._petId = null;
      this._resolvePetId();
      // 如果 petId 变了或之前没数据，重新加载
      if (this._petId && this._petId !== prevPetId) {
        this.loadData();
      } else if (this._petId) {
        this.loadData();
      }
    }
  },

  methods: {
    _resolvePetId() {
      if (this._petId) return;
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      const options = (page && page.options) || {};
      if (options.petId) {
        this._petId = options.petId;
        console.log('[weight-list] petId:', this._petId);
      } else {
        console.warn('[weight-list] 未获取到 petId, pages:', pages.length);
      }
    },

    async loadData() {
      console.log('[weight-list] loadData, petId:', this._petId);
      if (!this._petId) {
        this.setData({ loading: false });
        return;
      }

      this.setData({ loading: true });

      const pet = await getPet(this._petId);
      console.log('[weight-list] pet:', pet ? pet.name : 'null', 'weightRecords:', pet ? (pet.weightRecords || []).length : 0);

      if (!pet) {
        this.setData({ pet: {}, records: [], filteredRecords: [], loading: false });
        return;
      }

      const records = (pet.weightRecords || []).sort((a, b) => a.date.localeCompare(b.date));
      const filtered = this._filterRecords(records, this.data.currentPeriod);
      this.setData({ pet, records, filteredRecords: filtered, displayRecords: filtered.slice().reverse(), loading: false }, () => {
        if (filtered.length > 0) {
          this.drawChart();
        }
      });
    },

    /** 头像加载失败 → 回退 emoji */
    onAvatarError() {
      this.setData({ 'pet.avatarUrl': '' });
    },

    _filterRecords(records, period) {
      if (period === '全部') return records;
      const now = new Date();
      let cutoff;
      switch (period) {
        case '近1月': cutoff = new Date(now.getTime() - 30 * 86400000); break;
        case '近3月': cutoff = new Date(now.getTime() - 90 * 86400000); break;
        case '近6月': cutoff = new Date(now.getTime() - 180 * 86400000); break;
        default: return records;
      }
      return records.filter(r => new Date(r.date) >= cutoff);
    },

    switchPeriod(e) {
      const period = e.currentTarget.dataset.period;
      const filtered = this._filterRecords(this.data.records, period);
      this.setData({ currentPeriod: period, filteredRecords: filtered, displayRecords: filtered.slice().reverse() }, () => {
        if (filtered.length > 0) {
          this.drawChart();
        }
      });
    },

    drawChart() {
      const records = this.data.filteredRecords;
      if (records.length === 0) return;

      const query = wx.createSelectorQuery().in(this);
      query.select('#weightCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            console.warn('[weight-list] Canvas 节点未找到');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          const width = res[0].width;
          const height = res[0].height;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          this._renderChart(ctx, width, height, records);
        });
    },

    _renderChart(ctx, w, h, records) {
      // 清空
      ctx.clearRect(0, 0, w, h);

      const padding = { top: 20, right: 20, bottom: 40, left: 50 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      if (records.length < 2) {
        // 单点：画完整坐标轴 + 数据点
        const r = records[0];
        const minW = r.weight - 2;
        const maxW = r.weight + 2;
        const range = maxW - minW;

        // 网格线 + Y 轴标签
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartH / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(w - padding.right, y);
          ctx.stroke();
          const label = (maxW - (range / 4) * i).toFixed(1);
          ctx.fillStyle = '#999';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(label + 'kg', padding.left - 6, y + 3);
        }

        // X 轴底线
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        ctx.lineTo(w - padding.right, padding.top + chartH);
        ctx.stroke();

        // 数据点（居中）
        const x = padding.left + chartW / 2;
        const y = padding.top + chartH - ((r.weight - minW) / range) * chartH;

        // 水平参考线
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 数据点
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 数值标签
        ctx.fillStyle = '#FF9800';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.weight + 'kg', x, y - 12);

        // X 轴日期
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.fillText(r.date, x, h - padding.bottom + 16);
        return;
      }

      // 数据范围
      const weights = records.map(r => r.weight);
      const minW = Math.min(...weights) - 1;
      const maxW = Math.max(...weights) + 1;
      const range = maxW - minW || 1;

      // 坐标点
      const points = records.map((r, i) => ({
        x: padding.left + (chartW / (records.length - 1)) * i,
        y: padding.top + chartH - ((r.weight - minW) / range) * chartH,
        ...r
      }));

      // 网格线
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        // Y轴标签
        const label = (maxW - (range / 4) * i).toFixed(1);
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(label + 'kg', padding.left - 6, y + 3);
      }

      // 折线
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // 填充区域
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.lineTo(points[0].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 152, 0, 0.08)';
      ctx.fill();

      // 数据点
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.stroke();

        // X轴日期
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.date.slice(5), p.x, h - padding.bottom + 16);
      });
    },

    addWeight() {
      wx.navigateTo({ url: '/pages/weight-form/weight-form?petId=' + (this._petId || '') });
    }
  }
});
