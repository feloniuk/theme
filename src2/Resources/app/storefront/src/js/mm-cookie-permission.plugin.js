import CookiePermissionPlugin from 'src/plugin/cookie/cookie-permission.plugin';

export default class MMCookiePermissionPlugin extends CookiePermissionPlugin {
	init() {
		this._button = this.el.querySelector(this.options.buttonSelector);

		if (!this._isPreferenceSet()) {
			this._setBodyPadding();
			this._registerEvents();
		}

		this._consentGranted();
	}

	/**
	 * Shows cookie bar
	 */
	_showCookieBar() {
		this.el.style.display = 'flex';

		this.$emitter.publish('showCookieBar');
	}
	/**
	 * Calculates cookie bar height
	 */
	_calculateCookieBarHeight() {

	}
	/**
	 * Adds cookie bar height as padding-bottom on body
	 */

	_setBodyPadding() {
		this.$emitter.publish('setBodyPadding');
	}

	/**
	 * Removes padding-bottom from body
	 */
	_removeBodyPadding() {
		this.$emitter.publish('removeBodyPadding');
	}

	_consentGranted() {
		if (!window.gtag) {
			return
		}

		window.gtag('consent', 'update', {
			ad_storage: 'granted',
			ad_user_data: 'granted',
			ad_personalization: 'granted',
			analytics_storage: 'granted',
			functionality_storage: 'granted',
			personalization_storage: 'granted',
			security_storage: 'granted',
		});
	}
}
