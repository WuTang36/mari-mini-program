const { calcAge, formatDate } = require('../../utils/util');
const { getPet } = require('../../utils/storage');

Component({
  data: {
    pet: {},
    loaded: false,
    loadError: false
  },

  lifetimes: {
    attached() {
      this._initFromQuery();
    }
  },

  pageLifetimes: {
    show() {
      if (this._petId && this.data.loaded) {
        this.loadPet(this._petId);
      } else if (!this._petId) {
        this._initFromQuery();
      }
    }
  },

  methods: {
    _initFromQuery() {
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      const petId = (page && page.options) ? page.options.petId : '';
      if (petId && petId !== this._petId) {
        this._petId = petId;
        this.loadPet(petId);
      }
    },

    async loadPet(petId) {
      if (!petId) {
        console.warn('pet-detail: petId 为空，跳过加载');
        this.setData({ loadError: true, loaded: true });
        return;
      }

      try {
        const pet = await getPet(petId);
        if (!pet) {
          this.setData({ loadError: true, loaded: true });
          return;
        }

        const today = formatDate(new Date());
        const ageText = calcAge(pet.birthday, pet.birthdayEstimateAge);
        const vaccineRecords = pet.vaccineRecords || [];
        const dewormingRecords = pet.dewormingRecords || [];
        const weightRecords = pet.weightRecords || [];
        const medicalRecords = pet.medicalRecords || [];

        const lastVaccine = vaccineRecords.length > 0 ? vaccineRecords[vaccineRecords.length - 1].name : null;
        const lastWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight + 'kg' : null;
        const hasVaccineWarning = vaccineRecords.some(v => v.nextDate && v.nextDate <= today);
        const hasDewormWarning = dewormingRecords.some(d => d.nextDate && d.nextDate <= today);

        const safeAvatarUrl = (pet.avatarUrl && pet.avatarUrl.startsWith('cloud://')) ? pet.avatarUrl : '';

        this.setData({
          pet: {
            ...pet,
            avatarUrl: safeAvatarUrl,
            ageText,
            lastVaccine,
            lastWeight,
            medicalCount: medicalRecords.length,
            hasVaccineWarning,
            hasDewormWarning
          },
          loaded: true,
          loadError: false
        });
      } catch (err) {
        console.error('加载宠物详情失败:', err);
        this.setData({ loadError: true, loaded: true });
      }
    },

    /** 头像加载失败 → 回退 emoji 占位 */
    onAvatarError() {
      this.setData({ 'pet.avatarUrl': '' });
    },

    editPet() {
      wx.navigateTo({ url: '/pages/pet-form/pet-form?petId=' + this.data.pet._id });
    },

    goVaccine() {
      wx.navigateTo({ url: '/pages/vaccine-list/vaccine-list?petId=' + this.data.pet._id });
    },

    goDeworming() {
      wx.navigateTo({ url: '/pages/deworming-list/deworming-list?petId=' + this.data.pet._id });
    },

    goWeight() {
      wx.navigateTo({ url: '/pages/weight-list/weight-list?petId=' + this.data.pet._id });
    },

    goMedical() {
      wx.navigateTo({ url: '/pages/medical-list/medical-list?petId=' + this.data.pet._id });
    },

    goPedigree() {
      wx.navigateTo({ url: '/pages/pedigree-preview/pedigree-preview?petId=' + this.data.pet._id });
    },

    goDiary() {
      wx.navigateTo({ url: '/pages/diary-form/diary-form?petId=' + this.data.pet._id });
    },

    goReminder() {
      wx.navigateTo({ url: '/pages/reminder-center/reminder-center' });
    },

    goWeightForm() {
      wx.navigateTo({ url: '/pages/weight-form/weight-form?petId=' + this.data.pet._id });
    }
  }
});
