import BeginCheckoutOnCartEvent from 'src/plugin/google-analytics/events/begin-checkout-on-cart.event';
import LineItemHelper from '../line-item.helper';

export default class MMBeginCheckoutOnCartEvent extends BeginCheckoutOnCartEvent {
    _onBeginCheckout() {
        if (!this.active) {
            return;
        }

        gtag('event', 'begin_checkout', {
            'items': LineItemHelper.getLineItems(),
        });
    }
}
