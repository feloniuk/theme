import Plugin from 'src/plugin-system/plugin.class';

export default class MMCurrencySwitcherPlugin extends Plugin {
  static options = {
    currencies: [],
    storeSelect: true,
    countryCode: null,
    countryCodes: {
      USD: ["US", "CA", "MX", "AU", "NZ", "JP", "CN", "HK", "SG", "MY", "PH", "TH", "ID", "VN", "KR", "TW", "BR", "AR", "CL", "CO", "PE", "CR", "PA", "DO", "SV", "GT", "HN", "NI", "PR", "VE", "KY", "BZ", "TT", "BB", "BS", "JM", "AG", "DM", "GD", "KN", "LC", "VC", "FJ", "WS", "TO", "SB", "PW", "MH", "FM", "GU"]
    },
    storageKey: `mm-currency`,
    swAccessKey: null,
    swToken: null,
    regionButtonSelector: '.currency-switcher__item--region',
    cancelButtonSelector: '.currency-switcher__item--cancel',
    closeButtonSelector: '.currency-switcher__close',
  }

  init() {
    const stored = this.getStored();

    if (
      this.options.countryCode === stored?.countryCode &&
      this.options.swToken === stored?.session &&
      this.options.storeSelect
    ) {
      return;
    }

    this.currentCurrency = this.options.currencies.find(curr => curr.isCurrent);
    this.recommendedCurrency = this.getRecommendedCurrency();

    if (this.recommendedCurrency.isoCode === this.currentCurrency.isoCode) {
      return;
    }

    this.registerEventListeners();
    this.showPanel();
  }


  getStored() {
    const saved = localStorage.getItem(this.options.storageKey);

    if (saved) {
      return JSON.parse(saved)
    }
  }

  setStored() {
    const payload = {
      countryCode: this.options.countryCode,
      session: this.options.swToken
    };

    localStorage.setItem(this.options.storageKey, JSON.stringify(payload))
  }

  getRecommendedCurrency() {
    if (this.options.countryCodes['USD'].includes(this.options.countryCode)) {
      return this.options.currencies.find(curr => curr.isoCode === 'USD');
    } else {
      return this.options.currencies.find(curr => curr.isoCode === 'EUR');
    }
  }

  registerEventListeners() {
    const items = this.el.querySelectorAll(this.options.regionButtonSelector);
    [...items].map(el => {
      if (el.dataset.currency === this.recommendedCurrency.isoCode) {
        el.classList.remove('d-none');
      }

      el.addEventListener('click', () => this.confirm())
    });

    const close = this.el.querySelectorAll(this.options.cancelButtonSelector);
    const cancel = this.el.querySelectorAll(this.options.closeButtonSelector);

    [...close, ...cancel].forEach(el => {
      el.addEventListener('click', () => this.dismiss())
    });
  }

  showPanel() {
    this.el.classList.remove('d-none');
  }

  hidePanel() {
    this.el.classList.add('d-none');
  }

  dismiss() {
    this.setStored();
    this.hidePanel();
  }

  confirm() {
    const data = { currencyId: this.recommendedCurrency.id };

    fetch('/store-api/context', {
      method: 'PATCH',
      headers: {
        'sw-access-key': this.options.swAccessKey,
        'sw-context-token': this.options.swToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(() => {
      this.setStored();

      location.reload();
    })
      .catch(error => {
        console.error('switchCurrencyError', error);
      });
  }

  saveState() {
    localStorage.setItem(key, String(actualDate.getTime()));
  }

  loadState() {
    localStorage.removeItem(showViolationsKey);
  }
}
