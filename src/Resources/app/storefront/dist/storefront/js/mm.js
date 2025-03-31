// TOOLTIPS
(() => {
	tippy('.tippy-details', {
		content: '',
		theme: 'details',
		touch: true,
		trigger: 'click',
		hideOnClick: true,
		allowHTML: true,
		interactive: true,
		zIndex: 9999,

		onShow(instance) {
			const id = instance.reference.getAttribute('data-template');
			const template = document.getElementById(id);
			instance.setContent(template.innerHTML);
		},
	});

	tippy('.tippy-payment', {
		theme: 'widget',
		touch: true,
		hideOnClick: false,
		placement: 'top',
	});

	tippy('.tippy-copy', {
		theme: 'widget',
		touch: true,
		hideOnClick: false,
		placement: 'bottom',
	});

	tippy('.tippy-message', {
		touch: true,
		hideOnClick: false,
		placement: 'left',
	});

	tippy.delegate('html', {
		arrow: false,
		target: '.tippy',
		theme: 'transparent',
		followCursor: true,
		touch: true,
		hideOnClick: false,
		allowHTML: true,
		placement: 'right-end',
		offset: [-15, 0],
		zIndex: 9999,
		maxWidth: 'none',
		lazy: false,
		popperOptions: {
			strategy: 'fixed',
			modifiers: [
				{
					name: 'flip',
					options: { fallbackPlacements: ['bottom'] },
				},
				{
					name: 'preventOverflow',
					options: {
						altAxis: true,
						tether: false,
					},
				},
			],
		},
		onShow(instance) {
			const img = instance.popper.querySelector('img');

			if (!img.complete) {
				img.style.visibility = 'hidden';

				img.onload = () => {
					instance.setProps({});
					img.style.visibility = 'visible';
				};
			}
		},
	});
})();

// MAKE ALL EXTERNAL LINK _BLANK

(() => {
	const links = document.querySelectorAll('a[href^="http"]');
	const exernalLinks = [...links].filter(
		link => !link.href.includes(window.location.host) && !link.href.includes('light.gg/db')
	);

	// load light.gg only if document contain tooltips
	if ([...links].some(link => link.href.includes('light.gg/db'))) {
		const handler = document.querySelector('#light-gg');

		if (!handler) {
			return;
		}

		const script = document.createElement('script');
		script.src = handler.dataset.src;

		document.head.append(script);

		window['lggTT'] = {
			darkMode: true,
			renameLinks: true,
		};
	}

	exernalLinks.forEach(link => {
		link.rel = 'noopener noreferrer';
		link.target = '_blank';
	});
})();


// Smooth scroll
[...document.querySelectorAll('a[href^="#"]')]
	.filter(el => !['swag-amazon-pay-change-amazon-payment'].includes(el.id))
	.forEach(anchor => {
		anchor.addEventListener('click', function(e) {
			e.preventDefault();

			document.querySelector(this.getAttribute('href')).scrollIntoView({
				behavior: 'smooth'
			});
		});
	});

// Video Modal
(() => {
	const mmVideoModal = document.getElementById('mm-youtube-video');
	const mmVideoPlayer = document.getElementById('mm-youtube-player');

	if (mmVideoModal) {
		mmVideoModal.addEventListener('show.bs.modal', () => {
			mmVideoPlayer.src = mmVideoPlayer.dataset.src;
		})

		mmVideoModal.addEventListener('hide.bs.modal', () => {
			mmVideoPlayer.src = ''
		})
	}
})()


// Sprite loader
addEventListener("DOMContentLoaded", (event) => {
	loadSprite('/icons', 'icons');
});
