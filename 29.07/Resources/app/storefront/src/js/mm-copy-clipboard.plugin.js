import Plugin from 'src/plugin-system/plugin.class';

export default class MMCopyClipboardPlugin extends Plugin {
	static options = {
		text: '',
	};

	async init() {
		this._registerEvents();
	}

	_registerEvents() {
		this.el.addEventListener('click', this.copyToClipboard.bind(this));
	}

	copyToClipboard() {
		const fallbackCopyTextToClipboard = () => {
			const textArea = document.createElement('textarea');
			textArea.value = this.options.text;

			textArea.style.top = '0';
			textArea.style.left = '0';
			textArea.style.position = 'fixed';

			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();

			try {
				document.execCommand('copy');
			} catch (err) {
				console.error('Fallback: Oops, unable to copy', err);
			}

			document.body.removeChild(textArea);
		};

		const copyTextToClipboard = () => {
			if (!navigator.clipboard) {
				return fallbackCopyTextToClipboard();
			}

			navigator.clipboard.writeText(this.options.text);
		};

		copyTextToClipboard();
	}
}
