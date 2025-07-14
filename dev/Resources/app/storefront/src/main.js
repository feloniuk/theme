import MMOffcanvasMenuPlugin from './js/mm-offcanvas-menu.plugin';
import MMOrderMessengersPlugin from './js/mm-order-messengers.plugin';
import MMCookieConfigurationPlugin from './js/mm-cookie-configuration.plugin';
import MMCookiePermissionPlugin from './js/mm-cookie-permission.plugin';
import MMGoogleAnalyticsPlugin from './js/google-analytics/mm-google-analytics.plugin';
import MMGoogleAnalyticsClientPlugin from './js/google-analytics/mm-google-analytics-client.plugin';
import MMOfferButtonPlugin from './js/mm-offer-button.plugin';
import MMCopyClipboardPlugin from './js/mm-copy-clipboard.plugin';
import MMListingPlugin from './js/mm-listing.plugin';
import MMCurrencySwitcherPlugin from './js/mm-currency-switcher.plugin';
import MMAmazonPayConfirmPagePlugin from './js/mm-amazon-pay-confirm-page.plugin';
import GameSectionPlugin from './js/game-section.plugin.js';
import HeroSectionPlugin from './js/hero-section.plugin.js';
import WowBoostMenuPlugin from './js/wow-boost-menu.plugin.js';

const PluginManager = window.PluginManager;

PluginManager.override('CookiePermission', MMCookiePermissionPlugin, '[data-cookie-permission]');
PluginManager.override('CookieConfiguration', MMCookieConfigurationPlugin, '[data-cookie-permission]');

PluginManager.override('OffcanvasMenu', MMOffcanvasMenuPlugin, '[data-offcanvas-menu]');

PluginManager.register('CurrencySwitcher', MMCurrencySwitcherPlugin, '[data-currency-switcher]');
PluginManager.register('OrderMessengers', MMOrderMessengersPlugin, '[data-order-messengers]');
PluginManager.register('OfferButton', MMOfferButtonPlugin, '[data-offer-button]');
PluginManager.register('ListingPlugin', MMListingPlugin, '[data-listing]');
PluginManager.register('CopyClipboard', MMCopyClipboardPlugin, '[data-copy-clipboard]');
PluginManager.register('GameSection', GameSectionPlugin, '[data-game-section]');
PluginManager.register('HeroSection', HeroSectionPlugin, '[hero-game-section]');
PluginManager.register('WowBoostMenu', WowBoostMenuPlugin, '[data-wow-boost-menu]');

if (window.gtagActive) {
	PluginManager.register('GoogleAnalyticsClient', MMGoogleAnalyticsClientPlugin, '[data-ga-client]');
	PluginManager.override('GoogleAnalytics', MMGoogleAnalyticsPlugin);
}

if (PluginManager.getPluginInstances('AmazonPayConfirmPage')[0] === undefined) {
	PluginManager.override('AmazonPayConfirmPage', MMAmazonPayConfirmPagePlugin, '[data-amazon-pay-confirm-page]');
}

// Necessary for the webpack hot module reloading server
if (module.hot) {
	module.hot.accept();
}