import AddToCartEvent from 'src/plugin/google-analytics/events/add-to-cart.event';

export default class MMAddToCartEvent extends AddToCartEvent {
    _beforeFormSubmit(event) {
        if (!this.active) {
            return;
        }

        const formData = event.detail;
        let productId = null;

        formData.forEach((value, key) => {
            if (key.endsWith('[id]')) {
                productId = value;
            }
        });

        if (!productId) {
            console.warn('[Google Analytics Plugin] Product ID could not be fetched. Skipping.');
            return;
        }

        const quantity = parseInt(formData.get('lineItems[' + productId + '][quantity]'));
        const lineItemPrice = parseFloat(formData.get('lineItems[' + productId + '][lineItemPrice]'));
        const itemPrice = lineItemPrice / quantity;

        gtag('event', 'add_to_cart', {
            'currency': formData.get('lineItems[' + productId + '][currency]'),
            'value': lineItemPrice,
            'items': [{
                'item_id': formData.get('lineItems[' + productId + '][sourceId]'),
                'item_name': formData.get('product-name'),
                'currency': formData.get('lineItems[' + productId + '][currency]'),
                'price': itemPrice,
                'quantity': quantity,
            }],
        });
    }
}
