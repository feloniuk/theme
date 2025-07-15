import BeginCheckoutEvent from 'src/plugin/google-analytics/events/begin-checkout.event';
import LineItemHelper from '../line-item.helper';

export default class MMBeginCheckoutEvent extends BeginCheckoutEvent {
    _onBeginCheckout() {
        if (!this.active) {
            return;
        }

        gtag('event', 'begin_checkout', {
            'items': LineItemHelper.getLineItems(),
        });
    }
}
