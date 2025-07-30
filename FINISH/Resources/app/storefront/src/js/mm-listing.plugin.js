import ListingPlugin from 'src/plugin/listing/listing.plugin';

export default class MMListingPlugin extends ListingPlugin {
  _registerEvents() {
    super._registerEvents()

    this._cmsProductListingWrapper.addEventListener('click', (e) => this._processListingClick(e))
  }

  _findUpTag(el, attr) {
    while (el.parentNode) {
      el = el.parentNode;
      if (el[attr]) {
        return el;
      }
    }

    return null;
  }

  _processListingClick(e) {
    const listItemEl = this._findUpTag(e.target, 'href')

    if (listItemEl) {
      this.$emitter.publish('onListItemSelect', listItemEl);
    }
  }
}
