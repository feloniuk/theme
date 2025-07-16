import GoogleAnalyticsPlugin from 'src/plugin/google-analytics/google-analytics.plugin';
import AddToCartByNumberEvent from 'src/plugin/google-analytics/events/add-to-cart-by-number.event';
import LoginEvent from 'src/plugin/google-analytics/events/login.event';
import RemoveFromCartEvent from 'src/plugin/google-analytics/events/remove-from-cart.event';
import SearchAjaxEvent from 'src/plugin/google-analytics/events/search-ajax.event';
import SignUpEvent from 'src/plugin/google-analytics/events/sign-up.event';
import ViewSearchResultsEvent from 'src/plugin/google-analytics/events/view-search-results';

import MMAddToCartEvent from './events/add-to-cart.event';
import MMViewItemEvent from './events/view-item.event';
import MMViewItemListEvent from './events/view-item-list.event';
import MMSelectItemListEvent from './events/select-item-list.event';
import MMBeginCheckoutOnCartEvent from './events/begin-checkout-on-cart.event';
import MMBeginCheckoutEvent from './events/begin-checkout.event';

export default class MMGoogleAnalyticsPlugin extends GoogleAnalyticsPlugin {
  init() {
    this.startGoogleAnalytics();
  }

  registerDefaultEvents() {
    this.registerEvent(AddToCartByNumberEvent);
    this.registerEvent(LoginEvent);
    this.registerEvent(RemoveFromCartEvent);
    this.registerEvent(SearchAjaxEvent);
    this.registerEvent(SignUpEvent);
    this.registerEvent(ViewSearchResultsEvent);

    this.registerEvent(MMSelectItemListEvent);
    this.registerEvent(MMBeginCheckoutEvent);
    this.registerEvent(MMBeginCheckoutOnCartEvent);
    this.registerEvent(MMAddToCartEvent);
    this.registerEvent(MMViewItemEvent);
    this.registerEvent(MMViewItemListEvent);
  }
}
