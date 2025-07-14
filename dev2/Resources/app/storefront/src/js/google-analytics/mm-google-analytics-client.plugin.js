import Plugin from 'src/plugin-system/plugin.class';

export default class MMGoogleAnalyticsClientPlugin extends Plugin {
	init() {
		this.setClientId();
	}

	generateClientId() {
		const uniqueId = Math.floor(Math.random() * 9000000000) + 1000000000;  // Генерация случайного числа
		const timestamp = Math.floor(Date.now() / 1000);  // Получение текущего времени в секундах

		return `${uniqueId}.${timestamp}`;
	}

	extractClientId() {
		const cookie = document.cookie.split('; ').find(row => row.startsWith('_ga='));

		if (cookie) {
			const clientId = cookie.split('.').slice(-2).join('.');
			return clientId;
		}

		return this.generateClientId();
	}

	setClientId() {
		const clientId = this.extractClientId();

		this.el.value = clientId;
	}
}
