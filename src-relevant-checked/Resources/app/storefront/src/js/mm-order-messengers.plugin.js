import Plugin from 'src/plugin-system/plugin.class';
import DomAccessHelper from 'src/helper/dom-access.helper';

export default class MMOrderMessengersPlugin extends Plugin {
	static options = {
		messengersInputsSelector: '.messenger',
	};

	init() {
		this.changeEvent = new CustomEvent('change', { bubbles: true, cancelable: true });

		this.registerMessengers();
		this.parseMessengers();
	}

	registerMessengers() {
		try {
			this.messengers = DomAccessHelper.querySelectorAll(document, this.options.messengersInputsSelector);

			[...this.messengers].forEach(msg => {
				msg.addEventListener('input', this.parseMessengers.bind(this));
			});
		} catch (error) {}
	}

	parseMessengers() {
		const formData = [...this.messengers].reduce((acc, cur) => {
			const messenger = {
				label: cur.dataset.label,
				field: cur.dataset.field,
				content: cur.value,
			};

			acc = [...acc, messenger];

			return acc;
		}, []);

		this.el.value = JSON.stringify(formData);
	}
}
