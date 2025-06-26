import CookieConfigurationPlugin from 'src/plugin/cookie/cookie-configuration.plugin';
import CookieStorage from 'src/helper/storage/cookie-storage.helper';

export default class MMCookieConfigurationPlugin extends CookieConfigurationPlugin {
  _consentGranted() {
    const cookiePermissionPlugin = PluginManager.getPluginInstances('CookiePermission');

    if (cookiePermissionPlugin && cookiePermissionPlugin[0]) {
      cookiePermissionPlugin[0]._consentGranted();
    }
  }

  _handleSubmit() {
    const activeCookies = this._getCookies('active');
    const inactiveCookies = this._getCookies('inactive');
    const { cookiePreference } = this.options;

    const activeCookieNames = [];
    const inactiveCookieNames = [];

    inactiveCookies.forEach(({ cookie }) => {
      inactiveCookieNames.push(cookie);

      if (CookieStorage.getItem(cookie)) {
        CookieStorage.removeItem(cookie);
      }
    });

    /**
     * Cookies without value are passed to the updateListener
     * ( see "_handleUpdateListener" method )
     */
    activeCookies.forEach(({ cookie, value, expiration }) => {
      activeCookieNames.push(cookie);

      if (cookie && value) {
        CookieStorage.setItem(cookie, value, 365);
      }
    });

    CookieStorage.setItem(cookiePreference, '1', 365);

    this._handleUpdateListener(activeCookieNames, inactiveCookieNames);
    this.closeOffCanvas(document.$emitter.publish(COOKIE_CONFIGURATION_CLOSE_OFF_CANVAS));
  }

  _handleAcceptAll(offCanvas = null) {
    const allCookies = this._getCookies('all', offCanvas);
    this._setInitialState(allCookies);
    const { cookiePreference } = this.options;

    allCookies.forEach(({ cookie, value, expiration }) => {
      if (cookie && value) {
        CookieStorage.setItem(cookie, value, 365);
      }
    });

    CookieStorage.setItem(cookiePreference, '1', 365);

    this._handleUpdateListener(allCookies.map(({ cookie }) => cookie), []);
  }
}
