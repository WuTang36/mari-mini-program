Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: 'pages/index/index',
        text: '宠物',
        iconPath: '/images/tab-pet.png',
        selectedIconPath: '/images/tab-pet-active.png'
      },
      {
        pagePath: 'pages/album/album',
        text: '相册',
        iconPath: '/images/tab-album.png',
        selectedIconPath: '/images/tab-album-active.png'
      },
      {
        pagePath: 'pages/mine/mine',
        text: '我的',
        iconPath: '/images/tab-mine.png',
        selectedIconPath: '/images/tab-mine-active.png'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const index = data.index;
      const path = data.path;

      if (this.data.selected === index) {
        return;
      }

      this.setData({ selected: index });

      wx.switchTab({
        url: '/' + path
      });
    }
  }
});
