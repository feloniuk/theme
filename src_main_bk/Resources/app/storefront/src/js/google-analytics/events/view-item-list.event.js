import ViewItemListEvent from 'src/plugin/google-analytics/events/view-item-list.event';
import DomAccessHelper from 'src/helper/dom-access.helper';

export default class MMViewItemListEvent extends ViewItemListEvent {
    supports() {
        const listingWrapper = DomAccessHelper.querySelector(document, '.cms-element-product-listing-wrapper:not(.cms-element-product-listing-wrapper--blog)', false);

        return !!listingWrapper;
    }

    getListItems() {
        const productBoxes = DomAccessHelper.querySelectorAll(document, '.product-box', false);
        const lineItems = [];

        if (!productBoxes) {
            return;
        }

        productBoxes.forEach(item => {
            const id = DomAccessHelper.querySelector(item, 'input[name=product-id]').value;
            const name = DomAccessHelper.querySelector(item, 'input[name=product-name]').value;
            const brand = DomAccessHelper.querySelector(item, 'input[name=product-brand]').value || '';
            const category = DomAccessHelper.querySelector(item, 'input[name=product-category]').value || '';

            if (!id || !name) {
                return;
            }

            lineItems.push({
                item_id: id,
                item_name: name,
                item_brand: brand,
                item_category: category
            });
        });

        return lineItems;
    }

    execute() {
        if (!this.active) {
            return;
        }

        const listingWrapper = DomAccessHelper.querySelector(document, '.cms-element-product-listing-wrapper', false);
        
        const listingCategoryName = listingWrapper.dataset.listingCategoryName || '';
        const listingCategoryId = listingWrapper.dataset.listingCategoryId || '';
        const listingCurrency = listingWrapper.dataset.listingCurrency || '';

        gtag('event', 'view_item_list', {
            'item_list_name': listingCategoryName,
            'items': this.getListItems(),
        });
    }
}
