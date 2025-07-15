import Plugin from 'src/plugin-system/plugin.class';
import PluginManager from 'src/plugin-system/plugin.manager';
import DomAccessHelper from 'src/helper/dom-access.helper';
import DeviceDetection from 'src/helper/device-detection.helper';
import Iterator from 'src/helper/iterator.helper';

export default class MMOfferButtonPlugin extends Plugin {
	static options = {
		id: null,
		fetchPrice: true
	};

	async init() {
		this._registerEvents();
		this.fetchStoreApi = this.setStoreApiClient();

		if (!this.options.fetchPrice) {
			return;
		}

		this.startLoading();
		this.getContext();

		const { product } = await this.getProduct();
		this.product = product;

		this.formatProductData();
		this.stopLoading();
	}

	// FIXME
	setStoreApiClient() {
		const ContextPluginInstances = PluginManager.getPluginInstances('Context');

		return ContextPluginInstances[0].fetch;
	}

	_registerEvents() {
		this.el.addEventListener('click', this.addOfferToCart.bind(this));
	}

	// FIXME
	async getProduct() {
		const response = await this.fetchStoreApi(`/store-api/product/${this.options.id}`, {
			method: 'POST',
		}).then(r => r.json());

		const data = JSON.parse(response)
		return data
	}

	getContext() {
		const ContextPluginInstances = PluginManager.getPluginInstances('Context');
		this.context = ContextPluginInstances[0].options;
	}

	formatProductData() {
		if (!this.product) {
			return;
		}

		const price = this.product.calculatedPrice.unitPrice;
		const itemPrice = this.context.currency.template
			.split(this.context.currency.symbol)
			.map(el => (el ? price : null))
			.join(this.context.currency.symbol);

		this.el.insertAdjacentHTML('beforeend', ` ${itemPrice}`);
	}

	startLoading() {
		const html = `<span class="mm-loader">
				<span></span>
				<span></span>
				<span></span>
		</span>`;

		this.el.insertAdjacentHTML('beforeend', ` ${html}`);
	}

	stopLoading() {
		const loader = DomAccessHelper.querySelector(this.el, '.mm-loader');
		loader.remove();
	}

	openCart() {
		const event = new CustomEvent(DeviceDetection.isTouchDevice() ? 'touchstart' : 'click', {
			bubbles: true,
			cancelable: true,
		});

		const cartInstances = PluginManager.getPluginInstances('OffCanvasCart');
		Iterator.iterate(cartInstances, cart => cart.el.dispatchEvent(event));
	}

	// FIXME Проверить
	async addOfferToCart() {
		await this.fetchStoreApi(`/store-api/checkout/cart/line-item`, {
			method: 'POST',
			body: JSON.stringify({
				items: [
					{
						type: 'product',
						referencedId: this.options.id,
						quantity: 1,
					},
				],
			})
		}).then(r => r.json()).then(() => this.openCart());
	}
}
