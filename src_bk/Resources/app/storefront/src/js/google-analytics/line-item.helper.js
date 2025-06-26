import DomAccessHelper from 'src/helper/dom-access.helper';
import LineItemHelper from 'src/plugin/google-analytics/line-item.helper';

export default class MMLineItemHelper extends LineItemHelper {
    /**
     * @returns { Object }
     */
    static getLineItems() {
        const lineItemsContainer = DomAccessHelper.querySelector(document, '.hidden-line-items-information');
        const lineItemDataElements = DomAccessHelper.querySelectorAll(lineItemsContainer, '.hidden-line-item');
        const lineItems = [];

        lineItemDataElements.forEach(itemEl => {
            lineItems.push({
                item_id: DomAccessHelper.getDataAttribute(itemEl, 'id'),
                item_name: DomAccessHelper.getDataAttribute(itemEl, 'name'),
                item_brand: DomAccessHelper.getDataAttribute(itemEl, 'brand'),
                item_category: DomAccessHelper.getDataAttribute(itemEl, 'category'),
                quantity: parseInt(DomAccessHelper.getDataAttribute(itemEl, 'quantity')) || 0,
                price: parseFloat(DomAccessHelper.getDataAttribute(itemEl, 'price')) || 1,
                currency: DomAccessHelper.getDataAttribute(lineItemsContainer, 'currency'),
            });
        });

        return lineItems;
    }

    /**
     * @returns { Object }
     */
    static getAdditionalProperties() {
        const lineItemsContainer = DomAccessHelper.querySelector(document, '.hidden-line-items-information');

        return {
            currency: DomAccessHelper.getDataAttribute(lineItemsContainer, 'currency'),
            shipping: DomAccessHelper.getDataAttribute(lineItemsContainer, 'shipping'),
            value: DomAccessHelper.getDataAttribute(lineItemsContainer, 'value'),
            tax: DomAccessHelper.getDataAttribute(lineItemsContainer, 'tax'),
        };
    }
}
