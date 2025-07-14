import EventAwareAnalyticsEvent from 'src/plugin/google-analytics/event-aware-analytics-event';
import DomAccessHelper from 'src/helper/dom-access.helper';

export default class MMSelectItemListEvent extends EventAwareAnalyticsEvent {
    supports() {
        const listingWrapper = DomAccessHelper.querySelector(document, '.cms-element-product-listing-wrapper:not(.cms-element-product-listing-wrapper--blog)', false);

        return !!listingWrapper;
    }

    getPluginName() {
        return 'Listing';
    }

    getEvents() {
        return {
            'onListItemSelect': this._onListItemSelect.bind(this),
        };
    }

    _onListItemSelect(e) {
        if (!this.active) {
            return;
        }

        const listingWrapper = DomAccessHelper.querySelector(document, '.cms-element-product-listing-wrapper', false);

        const listingCategoryName = listingWrapper.dataset.listingCategoryName || '';
        const listingCategoryId = listingWrapper.dataset.listingCategoryId || '';
        const listingCurrency = listingWrapper.dataset.listingCurrency || '';

        const productId = DomAccessHelper.querySelector(e.detail, 'input[name=product-id]').value;
        const productName = DomAccessHelper.querySelector(e.detail, 'input[name=product-name]').value;
        const productBrand = DomAccessHelper.querySelector(e.detail, 'input[name=product-brand]').value || '';
        const productCategory = DomAccessHelper.querySelector(e.detail, 'input[name=product-category]').value || '';
        const productQuantity = parseInt(DomAccessHelper.querySelector(e.detail, 'input[name=product-quantity]').value || 1);
        const productPrice = parseFloat(DomAccessHelper.querySelector(e.detail, 'input[name=product-price]').value || 0);

        gtag('event', 'select_item', {
            'items': [{
                'item_id': productId,
                'item_name': productName,
                'item_brand': productBrand,
                'item_category': productCategory,
                'item_list_id': listingCategoryId,
                'item_list_name': listingCategoryName,
                'currency': listingCurrency,
                'price': productPrice,
                'qty': productQuantity
            }],
        });
    }
}
