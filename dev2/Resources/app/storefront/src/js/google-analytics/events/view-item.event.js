import ViewItemEvent from 'src/plugin/google-analytics/events/view-item.event';
import DomAccessHelper from 'src/helper/dom-access.helper';

export default class MMViewItemEvent extends ViewItemEvent {

    execute() {
        if (!this.active) {
            return;
        }

        const productItemElement = DomAccessHelper.querySelector(
            document,
            '[itemtype="https://schema.org/Product"]',
            false
        );
        if (!productItemElement) {
            console.warn('[Google Analytics Plugin] Product itemtype ([itemtype="https://schema.org/Product"]) could not be found in document.');

            return;
        }

        const productIdElement = DomAccessHelper.querySelector(
            productItemElement,
            'meta[itemprop="productID"]',
            false
        );
        const productNameElement = DomAccessHelper.querySelector(
            productItemElement,
            'meta[itemprop="name"]',
            false
        );

        const productBrandElement = DomAccessHelper.querySelector(
            productItemElement,
            'meta[itemprop="brand"]',
            false
        );

        const productCurrencyElement = DomAccessHelper.querySelector(
            productItemElement,
            'meta[itemprop="priceCurrency"]',
            false
        );

        const productPriceElement = DomAccessHelper.querySelector(
            productItemElement,
            'meta[itemprop="lowPrice"]',
            false
        );

        const productQuantityElement = DomAccessHelper.querySelector(
            productItemElement,
            '[data-qty]',
            false
        );

        const productCategoryElement = DomAccessHelper.querySelector(
            productItemElement,
            'meta[itemprop="category"]',
            false
        );

        if (!productIdElement || !productNameElement) {
            console.warn('[Google Analytics Plugin] Product ID (meta[itemprop="productID"]) or product name ([itemprop="name"]) could not be found within product scope.');

            return;
        }

        const productId = productIdElement.content;
        const productName = productNameElement.content;
        const productBrand = productBrandElement.content;
        const productPrice = parseFloat(productPriceElement.content) || 0;
        const productQuantity = parseInt(productQuantityElement.dataset.qty) || 1;
        const productCategory = productCategoryElement.content;
        const productCurrency = productCurrencyElement.content;

        if (!productId || !productName) {
            console.warn('[Google Analytics Plugin] Product ID or product name is empty, do not track page view.');

            return;
        }

        gtag('event', 'view_item', {
            'items': [{
                'item_id': productId,
                'item_name': productName,
                'item_brand': productBrand,
                'item_category': productCategory,
                'currency': productCurrency,
                'price': productPrice,
                'qty': productQuantity
            }],
        });
    }
}
