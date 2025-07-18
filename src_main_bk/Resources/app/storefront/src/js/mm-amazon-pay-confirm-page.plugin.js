import AmazonPayConfirmPagePlugin from '../../../../../../../SwagAmazonPay/src/Resources/app/storefront/src/swag-amazon-pay/amazon-pay-confirm-page.plugin';

export default class MMAmazonPayConfirmPagePlugin extends AmazonPayConfirmPagePlugin {
  _onLoadAmazonPayScript() {
    if (document.querySelector(this.options.changePaymentButtonSelector)) {
      window.amazon.Pay.bindChangeAction(this.options.changePaymentButtonSelector, {
        amazonCheckoutSessionId: this.options.checkoutSessionId,
        changeAction: 'changePayment',
      });
    }
  }
}
