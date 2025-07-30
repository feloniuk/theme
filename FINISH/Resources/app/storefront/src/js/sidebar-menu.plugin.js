import Plugin from 'src/plugin-system/plugin.class';

export default class SidebarMenuPlugin extends Plugin {
    static options = {
        swiperConfig: {
            direction: 'vertical',
            slidesPerView: 'auto',
            freeMode: true,
            mousewheel: {
                enabled: true,
                sensitivity: 1
            },
            scrollbar: {
                el: '.swiper-scrollbar',
                draggable: true,
            }
        },
        categorySelector: '.all-page-sidebar-menu-category',
        subcategorySelector: '.all-page-sidebar-subcategory-item',
        subcategoryGroupSelector: '.all-page-sidebar-subcategory-group',
        subcategoryTitleSelector: '.all-page-sidebar-subcategory-title',
        subcategorySubitemSelector: '.all-page-sidebar-subcategory-subitem',
        expandButtonSelector: '[data-all-page-sidebar-expand-button]',
        addButtonSelector: '[data-all-page-sidebar-add-button]',
        backButtonSelector: '[data-all-page-sidebar-back-button]',
        showAllButtonSelector: '[data-all-page-sidebar-show-all-button]',
        subcategoriesSelector: '[data-all-page-sidebar-subcategories]',
        subcategoryExpandSelector: '[data-all-page-sidebar-subcategory-expand]',
        subcategoryItemsSelector: '[data-all-page-sidebar-subcategory-items]'
    };

    init() {
        this._initCurrentContext();
        this._loadSwiperAndInit();
        this._initShowAllLogic();
        this._addHoverEffects();
    }

    _initCurrentContext() {
        this.currentCategoryId = this.el.dataset.currentCategory;
        this.contextCategoryId = this.el.dataset.contextCategory;
        this._markActiveElements();
    }

    _markActiveElements() {
        if (this.currentCategoryId) {
            const currentElements = this.el.querySelectorAll(`[data-current="true"]`);
            currentElements.forEach(element => {
                element.classList.add('all-page-sidebar-active-current');
            });
        }

        if (this.contextCategoryId) {
            const contextCategory = this.el.querySelector(`[data-category-id="${this.contextCategoryId}"]`);
            if (contextCategory) {
                contextCategory.classList.add('all-page-sidebar-active-parent');
            }
        }
    }

    _addHoverEffects() {
        const hoverElements = this.el.querySelectorAll(
            '.all-page-sidebar-menu-category, .all-page-sidebar-subcategory-item, .all-page-sidebar-subcategory-title, .all-page-sidebar-subcategory-subitem, a.all-page-sidebar-subcategory-item, a.all-page-sidebar-subcategory-title, a.all-page-sidebar-subcategory-subitem'
        );

        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!element.classList.contains('all-page-sidebar-current-category')) {
                    element.classList.add('all-page-sidebar-hover-effect');
                }
            });

            element.addEventListener('mouseleave', () => {
                element.classList.remove('all-page-sidebar-hover-effect');
            });
        });
    }

    async _loadSwiperAndInit() {
        if (typeof Swiper === 'undefined') {
            try {
                await this._loadSwiperScript();
            } catch (error) {
                console.warn('Failed to load Swiper.js', error);
                return;
            }
        }

        this._initializeSwiper();
        this._registerEvents();
    }

    _loadSwiperScript() {
        return new Promise((resolve, reject) => {
            if (typeof Swiper !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    _initializeSwiper() {
        const swiperContainer = this.el.querySelector('.all-page-sidebar-menu-swiper');
        if (!swiperContainer) return;

        this.swiper = new Swiper(swiperContainer, {
            ...this.options.swiperConfig,
            on: {
                init: () => {
                    this.$emitter.publish('swiperInitialized');
                }
            }
        });
    }

    _initShowAllLogic() {
        this.maxVisibleHeight = window.innerHeight * 0.8;
        this.isShowAllActive = false;
        this._limitVisibleItems();
        this._updateShowAllButton();
    }

    _limitVisibleItems() {
        if (this.isShowAllActive) return;

        const menuContent = this.el.querySelector('.all-page-sidebar-menu-content');
        if (!menuContent) return;

        let currentHeight = 0;
        const categories = this.el.querySelectorAll('.all-page-sidebar-menu-category');

        categories.forEach((category, index) => {
            const categoryHeight = category.offsetHeight;

            if (category.classList.contains('all-page-sidebar-context-category')) {
                currentHeight += categoryHeight;
                return;
            }

            if (currentHeight + categoryHeight > this.maxVisibleHeight && index > 2) {
                category.style.display = 'none';
                category.setAttribute('data-all-page-sidebar-hidden-by-show-all', 'true');
            } else {
                currentHeight += categoryHeight;
                category.style.display = 'block';
                category.removeAttribute('data-all-page-sidebar-hidden-by-show-all');
            }
        });
    }

    _showAllItems() {
        const hiddenCategories = this.el.querySelectorAll('[data-all-page-sidebar-hidden-by-show-all]');
        hiddenCategories.forEach(category => {
            category.style.display = 'block';
            category.removeAttribute('data-all-page-sidebar-hidden-by-show-all');
        });
        this.isShowAllActive = true;
    }

    _hideExtraItems() {
        this.isShowAllActive = false;
        this._limitVisibleItems();
        this.collapseAllSubcategories();
    }

    _updateShowAllButton() {
        const showAllButton = this.el.querySelector(this.options.showAllButtonSelector);
        if (!showAllButton) return;

        const hasHiddenItems = this.el.querySelectorAll('[data-all-page-sidebar-hidden-by-show-all]').length > 0;

        if (this.isShowAllActive) {
            showAllButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 15L12 9L6 15"/>
                </svg>
                Show Less
            `;
        } else {
            showAllButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9L12 15L18 9"/>
                </svg>
                Show All
            `;
        }

        showAllButton.style.display = (hasHiddenItems || this.isShowAllActive) ? 'flex' : 'none';
    }

    _registerEvents() {
        const categories = this.el.querySelectorAll(this.options.categorySelector);
        categories.forEach(category => {
            category.addEventListener('click', this._onCategoryClick.bind(this));
        });

        const expandButtons = this.el.querySelectorAll(this.options.expandButtonSelector);
        expandButtons.forEach(button => {
            button.addEventListener('click', this._onExpandButtonClick.bind(this));
        });

        const subcategoryExpandButtons = this.el.querySelectorAll(this.options.subcategoryExpandSelector);
        subcategoryExpandButtons.forEach(button => {
            button.addEventListener('click', this._onSubcategoryExpandClick.bind(this));
        });

        const addButtons = this.el.querySelectorAll(this.options.addButtonSelector);
        addButtons.forEach(button => {
            button.addEventListener('click', this._onAddButtonClick.bind(this));
        });

        const backButton = this.el.querySelector(this.options.backButtonSelector);
        if (backButton) {
            backButton.addEventListener('click', this._onBackButtonClick.bind(this));
        }

        const showAllButton = this.el.querySelector(this.options.showAllButtonSelector);
        if (showAllButton) {
            showAllButton.addEventListener('click', this._onShowAllButtonClick.bind(this));
        }

        window.addEventListener('resize', () => {
            this.maxVisibleHeight = window.innerHeight * 0.8;
            if (!this.isShowAllActive) {
                this._limitVisibleItems();
                this._updateShowAllButton();
            }
        });
    }

    _onCategoryClick(event) {
        event.stopPropagation();

        // Проверяем, был ли клик по кнопке expand или add
        if (event.target.closest('[data-all-page-sidebar-expand-button]') ||
            event.target.closest('[data-all-page-sidebar-add-button]')) {
            return;
        }

        const category = event.currentTarget;
        const categoryId = category.dataset.categoryId;
        const categoryUrl = category.dataset.categoryUrl;
        const categoryName = category.querySelector('.all-page-sidebar-category-title').textContent;
        const isExpandable = category.dataset.expandable === 'true';

        const clickedLink = event.target.closest('a');
        if (clickedLink) {
            this._addClickFeedback(clickedLink);
        }


        // Если категория имеет URL, сразу переходим по ней
        if (categoryUrl) {
            window.location.href = categoryUrl;
            return;
        }

        // Если категория раскрываемая, но не имеет URL, то переключаем состояние
        if (isExpandable) {
            const expandButton = category.querySelector(this.options.expandButtonSelector);
            const subcategories = category.querySelector(this.options.subcategoriesSelector);

            if (expandButton && subcategories) {
                this._toggleSubcategories(subcategories, expandButton);
            }

            this.$emitter.publish('categoryExpanded', {
                categoryId,
                categoryName,
                categoryElement: category
            });
        }

        this.$emitter.publish('categoryClicked', {
            categoryId,
            categoryName,
            categoryElement: category
        });
    }

    _onExpandButtonClick(event) {
        event.stopPropagation();
        event.preventDefault();

        const button = event.currentTarget;
        const category = button.closest('.all-page-sidebar-menu-category');
        const subcategories = category.querySelector(this.options.subcategoriesSelector);

        if (!subcategories) return;

        const isExpanded = subcategories.style.display === 'block' || subcategories.classList.contains('all-page-sidebar-context-expanded');

        if (isExpanded) {
            this._collapseSubcategories(subcategories, button);
        } else {
            this._expandSubcategories(subcategories, button);
        }
    }

    _onSubcategoryExpandClick(event) {
        event.stopPropagation();
        event.preventDefault();

        const button = event.currentTarget;
        const subcategoryGroup = button.closest('.all-page-sidebar-subcategory-group');
        const subcategoryItems = subcategoryGroup.querySelector(this.options.subcategoryItemsSelector);

        if (!subcategoryItems) return;

        const isExpanded = subcategoryItems.style.display === 'block';

        if (isExpanded) {
            this._collapseSubcategoryItems(subcategoryItems, button);
        } else {
            this._expandSubcategoryItems(subcategoryItems, button);
        }
    }

    // ИСПРАВЛЕННЫЕ МЕТОДЫ ОТКРЫТИЯ/ЗАКРЫТИЯ
    _toggleSubcategories(subcategories, button) {
        const isExpanded = this._isElementExpanded(subcategories);

        if (isExpanded) {
            this._collapseSubcategories(subcategories, button);
        } else {
            this._expandSubcategories(subcategories, button);
        }
    }

    _toggleSubcategoryItems(subcategoryItems, button) {
        const isExpanded = this._isElementExpanded(subcategoryItems);

        if (isExpanded) {
            this._collapseSubcategoryItems(subcategoryItems, button);
        } else {
            this._expandSubcategoryItems(subcategoryItems, button);
        }
    }

    _isElementExpanded(element) {
        // Более надежная проверка состояния элемента
        const isDisplayed = element.style.display === 'block';
        const hasExpandedClass = element.classList.contains('all-page-sidebar-expanded');
        const hasContextClass = element.classList.contains('all-page-sidebar-context-expanded');

        return isDisplayed || hasExpandedClass || hasContextClass;
    }

    _expandSubcategories(subcategories, button) {
        const category = button.closest('.all-page-sidebar-menu-category');

        // Убираем конфликтующие классы
        subcategories.classList.remove('all-page-sidebar-context-expanded');

        // Устанавливаем состояние
        subcategories.style.display = 'block';
        subcategories.classList.add('all-page-sidebar-expanded');

        if (!category.classList.contains('all-page-sidebar-context-category')) {
            category.classList.add('all-page-sidebar-expanded');
        }

        // Обновляем иконку
        this._updateButtonIcon(button, true);

        // Анимация появления (такая же как у подкатегорий)
        subcategories.style.opacity = '0';
        subcategories.style.transform = 'translateY(-8px)';

        requestAnimationFrame(() => {
            subcategories.style.transition = 'all 0.3s ease';
            subcategories.style.opacity = '1';
            subcategories.style.transform = 'translateY(0)';
        });

        // Обновляем Swiper после анимации
        this._updateSwiperAfterDelay(350);

        this.$emitter.publish('subcategoriesExpanded', { subcategories, button });
    }

    _collapseSubcategories(subcategories, button) {
        const category = button.closest('.all-page-sidebar-menu-category');

        // Обновляем иконку сразу
        this._updateButtonIcon(button, false);

        // Анимация сворачивания
        subcategories.style.transition = 'all 0.3s ease';
        subcategories.style.opacity = '0';
        subcategories.style.transform = 'translateY(-8px)';

        setTimeout(() => {
            subcategories.style.display = 'none';
            subcategories.classList.remove('all-page-sidebar-expanded', 'all-page-sidebar-context-expanded');

            if (!category.classList.contains('all-page-sidebar-context-category')) {
                category.classList.remove('all-page-sidebar-expanded');
            }

            // Сбрасываем стили
            subcategories.style.transition = '';
            subcategories.style.opacity = '';
            subcategories.style.transform = '';

            // Обновляем Swiper после завершения анимации
            this._updateSwiperAfterDelay(50);
        }, 300);

        this.$emitter.publish('subcategoriesCollapsed', { subcategories, button });
    }

    _expandSubcategoryItems(subcategoryItems, button) {
        const subcategoryGroup = button.closest('.all-page-sidebar-subcategory-group');

        subcategoryGroup.classList.add('all-page-sidebar-expanded');
        subcategoryItems.style.display = 'block';

        // Обновляем иконку
        this._updateButtonIcon(button, true);

        // Анимация появления (такая же как у основных категорий)
        subcategoryItems.style.opacity = '0';
        subcategoryItems.style.transform = 'translateY(-8px)';

        requestAnimationFrame(() => {
            subcategoryItems.style.transition = 'all 0.3s ease';
            subcategoryItems.style.opacity = '1';
            subcategoryItems.style.transform = 'translateY(0)';
        });

        // Обновляем Swiper после анимации
        this._updateSwiperAfterDelay(350);

        this.$emitter.publish('subcategoryItemsExpanded', { subcategoryItems, button });
    }

    _collapseSubcategoryItems(subcategoryItems, button) {
        const subcategoryGroup = button.closest('.all-page-sidebar-subcategory-group');

        // Обновляем иконку
        this._updateButtonIcon(button, false);

        // Анимация сворачивания
        subcategoryItems.style.transition = 'all 0.3s ease';
        subcategoryItems.style.opacity = '0';
        subcategoryItems.style.transform = 'translateY(-8px)';

        setTimeout(() => {
            subcategoryItems.style.display = 'none';
            subcategoryGroup.classList.remove('all-page-sidebar-expanded');

            // Сбрасываем стили
            subcategoryItems.style.transition = '';
            subcategoryItems.style.opacity = '';
            subcategoryItems.style.transform = '';

            // Обновляем Swiper после завершения анимации
            this._updateSwiperAfterDelay(50);
        }, 300);

        this.$emitter.publish('subcategoryItemsCollapsed', { subcategoryItems, button });
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    _updateButtonIcon(button, isExpanded) {
        if (isExpanded) {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8L14 8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            `;
            button.classList.add('all-page-sidebar-expanded');
        } else {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2V14" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M2 8L14 8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            `;
            button.classList.remove('all-page-sidebar-expanded');
        }
    }

    _updateSwiperAfterDelay(delay = 100) {
        setTimeout(() => {
            if (this.swiper) {
                this.swiper.update();
            }
        }, delay);
    }

    _onAddButtonClick(event) {
        event.stopPropagation();

        const button = event.currentTarget;
        const category = button.closest('.all-page-sidebar-menu-category');
        const categoryId = category.dataset.categoryId;
        const categoryName = category.querySelector('.all-page-sidebar-category-title').textContent;

        this._addClickFeedback(button);

        this.$emitter.publish('addButtonClicked', {
            categoryId,
            categoryName,
            button,
            category
        });
    }

    _onBackButtonClick(event) {
        this.$emitter.publish('backButtonClicked', { button: event.currentTarget });
    }

    _onShowAllButtonClick(event) {
        if (this.isShowAllActive) {
            this._hideExtraItems();
        } else {
            this._showAllItems();
        }

        this._updateShowAllButton();

        if (!this.isShowAllActive) {
            const menuContent = this.el.querySelector('.all-page-sidebar-menu-content');
            if (menuContent) {
                menuContent.scrollTop = 0;
            }
        }

        this.$emitter.publish('showAllButtonClicked', {
            button: event.currentTarget,
            isShowAllActive: this.isShowAllActive
        });
    }

    _addClickFeedback(element) {
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
            element.style.transform = '';
        }, 100);
    }

    // ПУБЛИЧНЫЕ МЕТОДЫ
    expandAllSubcategories() {
        const expandButtons = this.el.querySelectorAll(this.options.expandButtonSelector);
        expandButtons.forEach(button => {
            const category = button.closest('.all-page-sidebar-menu-category');
            const subcategories = category.querySelector(this.options.subcategoriesSelector);
            if (subcategories && !this._isElementExpanded(subcategories)) {
                this._expandSubcategories(subcategories, button);
            }
        });

        setTimeout(() => {
            const subcategoryExpandButtons = this.el.querySelectorAll(this.options.subcategoryExpandSelector);
            subcategoryExpandButtons.forEach(button => {
                const subcategoryGroup = button.closest('.all-page-sidebar-subcategory-group');
                const subcategoryItems = subcategoryGroup.querySelector(this.options.subcategoryItemsSelector);
                if (subcategoryItems && !this._isElementExpanded(subcategoryItems)) {
                    this._expandSubcategoryItems(subcategoryItems, button);
                }
            });
        }, 200);
    }

    collapseAllSubcategories() {
        const subcategoryExpandButtons = this.el.querySelectorAll(this.options.subcategoryExpandSelector);
        subcategoryExpandButtons.forEach(button => {
            const subcategoryGroup = button.closest('.all-page-sidebar-subcategory-group');
            const subcategoryItems = subcategoryGroup.querySelector(this.options.subcategoryItemsSelector);
            if (subcategoryItems && this._isElementExpanded(subcategoryItems)) {
                this._collapseSubcategoryItems(subcategoryItems, button);
            }
        });

        setTimeout(() => {
            const expandButtons = this.el.querySelectorAll(this.options.expandButtonSelector);
            expandButtons.forEach(button => {
                const category = button.closest('.all-page-sidebar-menu-category');
                const subcategories = category.querySelector(this.options.subcategoriesSelector);

                if (subcategories &&
                    this._isElementExpanded(subcategories) &&
                    !subcategories.classList.contains('all-page-sidebar-context-expanded') &&
                    !category.classList.contains('all-page-sidebar-context-category')) {
                    this._collapseSubcategories(subcategories, button);
                }
            });
        }, 200);
    }

    updateSwiper() {
        if (this.swiper) {
            this.swiper.update();
        }
    }

    destroy() {
        if (this.swiper) {
            this.swiper.destroy();
        }
        super.destroy();
    }
}