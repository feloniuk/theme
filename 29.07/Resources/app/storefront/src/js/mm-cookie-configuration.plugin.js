import CookieConfigurationPlugin from 'src/plugin/cookie/cookie-configuration.plugin';

export default class MMCookieConfigurationPlugin extends CookieConfigurationPlugin {
  _consentGranted() {
    const cookiePermissionPlugin = PluginManager.getPluginInstances('CookiePermission');

    if (cookiePermissionPlugin && cookiePermissionPlugin[0]) {
      cookiePermissionPlugin[0]._consentGranted();
    }
  }
}
