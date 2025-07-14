import OffcanvasMenuPlugin from 'src/plugin/main-menu/offcanvas-menu.plugin';

export default class MMOffcanvasMenuPlugin extends OffcanvasMenuPlugin {
  _animateForward(menuContent, currentContent) {
    if (this._placeholder.innerHTML === '') {
      this._placeholder.innerHTML = currentContent;
    }
    this._overlay.classList.remove('reset-position');
    this._overlay.classList.remove(this.options.transitionClass);
    this._overlay.style.transform = 'translateX(110%)';
    this._overlay.innerHTML = menuContent;

    setTimeout(() => {
      this._overlay.classList.add(this.options.transitionClass);
      this._overlay.style.transform = 'translateX(0%)';
    }, 1);

    setTimeout(() => {
      this._placeholder.classList.add('is-overlayed');
    }, 100)

    setTimeout(() => {
      this._overlay.classList.add('reset-position');
    }, 400);

    this.$emitter.publish('animateForward');
  }

  _animateInstant(menuContent) {
    super._animateInstant(menuContent);
  }

  _animateBackward(menuContent, currentContent) {
    if (this._overlay.innerHTML === '') {
      this._overlay.innerHTML = currentContent;
    }
    this._placeholder.innerHTML = menuContent;
    this._overlay.classList.remove('reset-position');
    this._overlay.classList.remove(this.options.transitionClass);
    this._overlay.style.transform = 'translateX(0%)';

    setTimeout(() => {
      this._overlay.classList.add(this.options.transitionClass);
      this._overlay.style.transform = 'translateX(110%)';
    }, 1);

    setTimeout(() => {
      this._placeholder.classList.remove('is-overlayed');
    }, 300);

    setTimeout(() => {
      this._overlay.classList.add('reset-position');
    }, 400);

    this.$emitter.publish('animateBackward');
  }
}
