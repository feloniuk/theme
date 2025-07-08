import Plugin from 'src/plugin-system/plugin.class';

export default class WowBoostMenuPlugin extends Plugin {
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
        categorySelector: '.menu-category',
        subcategorySelector: '.subcategory-item',
        subcategoryGroupSelector: '.subcategory-group',
        subcategoryTitleSelector: '.subcategory-title',
        subcategorySubitemSelector: '.subcategory-subitem',
        expandButtonSelector: '[data-expand-button]',
        addButtonSelector: '[data-add-button]',
        backButtonSelector: '[data-back-button]',
        showAllButtonSelector: '[data-show-all-button]',
        subcategoriesSelector: '[data-subcategories]',
        subcategoryExpandSelector: '[data-subcategory-expand]',
        subcategoryItemsSelector: '[data-subcategory-items]'
    };

    init() {
        this._loadSwiperAndInit();
        this._initShowAllLogic();
    }

    async _loadSwiperAndInit() {
        // Проверяем доступность Swiper
        if (typeof Swiper === 'undefined') {
            try {
                // Если Swiper не загружен, пытаемся его подключить
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
        const swiperContainer = this.el.querySelector('.wow-menu-swiper');
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
        // Определяем максимальную высоту для видимых элементов (примерно 80% от высоты экрана)
        this.maxVisibleHeight = window.innerHeight * 0.8;
        this.isShowAllActive = false;

        // Скрываем элементы, которые не помещаются на экран
        this._limitVisibleItems();

        // Обновляем состояние кнопки Show All
        this._updateShowAllButton();
    }

    _limitVisibleItems() {
        if (this.isShowAllActive) return;

        const menuContent = this.el.querySelector('.wow-menu-content');
        if (!menuContent) return;

        let currentHeight = 0;
        const categories = this.el.querySelectorAll('.menu-category');

        categories.forEach((category, index) => {
            const categoryHeight = category.offsetHeight;

            if (currentHeight + categoryHeight > this.maxVisibleHeight && index > 2) {
                // Скрываем категории, которые не помещаются (но оставляем минимум 3)
                category.style.display = 'none';
                category.setAttribute('data-hidden-by-show-all', 'true');
            } else {
                currentHeight += categoryHeight;
                category.style.display = 'block';
                category.removeAttribute('data-hidden-by-show-all');
            }
        });
    }

    _showAllItems() {
        const hiddenCategories = this.el.querySelectorAll('[data-hidden-by-show-all]');
        hiddenCategories.forEach(category => {
            category.style.display = 'block';
            category.removeAttribute('data-hidden-by-show-all');
        });
        this.isShowAllActive = true;
    }

    _hideExtraItems() {
        this.isShowAllActive = false;
        this._limitVisibleItems();

        // Закрываем все открытые подкатегории
        this.collapseAllSubcategories();
    }

    _updateShowAllButton() {
        const showAllButton = this.el.querySelector(this.options.showAllButtonSelector);
        if (!showAllButton) return;

        const hasHiddenItems = this.el.querySelectorAll('[data-hidden-by-show-all]').length > 0;

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

        // Показываем кнопку только если есть скрытые элементы или активен Show All режим
        showAllButton.style.display = (hasHiddenItems || this.isShowAllActive) ? 'flex' : 'none';
    }

    _registerEvents() {
        // Обработка кликов по категориям
        const categories = this.el.querySelectorAll(this.options.categorySelector);
        categories.forEach(category => {
            category.addEventListener('click', this._onCategoryClick.bind(this));
        });

        // Обработка кликов по подкатегориям (простые элементы)
        const subcategories = this.el.querySelectorAll(this.options.subcategorySelector);
        subcategories.forEach(subcategory => {
            subcategory.addEventListener('click', this._onSubcategoryClick.bind(this));
        });

        // Обработка кликов по подэлементам (вложенные элементы)
        const subcategorySubitems = this.el.querySelectorAll(this.options.subcategorySubitemSelector);
        subcategorySubitems.forEach(subitem => {
            subitem.addEventListener('click', this._onSubcategoryClick.bind(this));
        });

        // Обработка кликов по заголовкам групп подкатегорий
        const subcategoryTitles = this.el.querySelectorAll(this.options.subcategoryTitleSelector);
        subcategoryTitles.forEach(title => {
            title.addEventListener('click', this._onSubcategoryTitleClick.bind(this));
        });

        // Обработка кликов по кнопкам раскрытия основных категорий
        const expandButtons = this.el.querySelectorAll(this.options.expandButtonSelector);
        expandButtons.forEach(button => {
            button.addEventListener('click', this._onExpandButtonClick.bind(this));
        });

        // Обработка кликов по кнопкам раскрытия подгрупп
        const subcategoryExpandButtons = this.el.querySelectorAll(this.options.subcategoryExpandSelector);
        subcategoryExpandButtons.forEach(button => {
            button.addEventListener('click', this._onSubcategoryExpandClick.bind(this));
        });

        // Обработка кликов по кнопкам добавления
        const addButtons = this.el.querySelectorAll(this.options.addButtonSelector);
        addButtons.forEach(button => {
            button.addEventListener('click', this._onAddButtonClick.bind(this));
        });

        // Обработка кнопки "Назад"
        const backButton = this.el.querySelector(this.options.backButtonSelector);
        if (backButton) {
            backButton.addEventListener('click', this._onBackButtonClick.bind(this));
        }

        // Обработка кнопки "Показать все"
        const showAllButton = this.el.querySelector(this.options.showAllButtonSelector);
        if (showAllButton) {
            showAllButton.addEventListener('click', this._onShowAllButtonClick.bind(this));
        }

        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.maxVisibleHeight = window.innerHeight * 0.8;
            if (!this.isShowAllActive) {
                this._limitVisibleItems();
                this._updateShowAllButton();
            }
        });
    }

    _onCategoryClick(event) {
        // Проверяем, что клик не был по кнопке expand/add
        if (event.target.closest('[data-expand-button]') ||
            event.target.closest('[data-add-button]')) {
            return;
        }

        const category = event.currentTarget;
        const categoryId = category.dataset.categoryId;
        const categoryUrl = category.dataset.categoryUrl;
        const categoryName = category.querySelector('.category-title').textContent;
        const isExpandable = category.dataset.expandable === 'true';

        // Добавляем визуальную обратную связь
        this._addClickFeedback(category);

        // Если категория раскрываемая (имеет подкатегории), только раскрываем её
        if (isExpandable) {
            const expandButton = category.querySelector(this.options.expandButtonSelector);
            const subcategories = category.querySelector(this.options.subcategoriesSelector);

            if (expandButton && subcategories) {
                const isExpanded = subcategories.style.display === 'block';

                if (isExpanded) {
                    this._collapseSubcategories(subcategories, expandButton);
                } else {
                    this._expandSubcategories(subcategories, expandButton);
                }
            }

            // Публикуем событие без перехода
            this.$emitter.publish('categoryExpanded', {
                categoryId,
                categoryName,
                categoryElement: category
            });

            return;
        }

        // Если категория не раскрываемая и есть URL, переходим по нему
        if (categoryUrl) {
            window.location.href = categoryUrl;
            return;
        }

        // Публикуем событие
        this.$emitter.publish('categoryClicked', {
            categoryId,
            categoryName,
            categoryElement: category
        });
    }

    _onSubcategoryClick(event) {
        event.stopPropagation();

        const subcategory = event.currentTarget;
        const subcategoryId = subcategory.dataset.subcategoryId;
        const subcategoryUrl = subcategory.dataset.subcategoryUrl;
        const subcategoryName = subcategory.textContent.trim();
        const difficulty = subcategory.dataset.difficulty;

        // Добавляем визуальную обратную связь
        this._addClickFeedback(subcategory);

        // Если есть URL, переходим по нему
        if (subcategoryUrl) {
            window.location.href = subcategoryUrl;
            return;
        }

        // Публикуем событие
        this.$emitter.publish('subcategoryClicked', {
            subcategoryId,
            subcategoryName,
            difficulty,
            subcategoryElement: subcategory
        });
    }

    _onSubcategoryTitleClick(event) {
        // Проверяем, что клик не был по кнопке expand
        if (event.target.closest('[data-subcategory-expand]')) {
            return;
        }

        const title = event.currentTarget;
        const subcategoryId = title.dataset.subcategoryId;
        const subcategoryUrl = title.dataset.subcategoryUrl;
        const subcategoryName = title.textContent.trim();

        // Добавляем визуальную обратную связь
        this._addClickFeedback(title);

        // Если есть URL, переходим по нему
        if (subcategoryUrl) {
            window.location.href = subcategoryUrl;
            return;
        }

        // Публикуем событие
        this.$emitter.publish('subcategoryTitleClicked', {
            subcategoryId,
            subcategoryName,
            subcategoryElement: title
        });
    }

    _onExpandButtonClick(event) {
        event.stopPropagation();

        const button = event.currentTarget;
        const category = button.closest('.menu-category');
        const subcategories = category.querySelector(this.options.subcategoriesSelector);

        if (!subcategories) return;

        const isExpanded = subcategories.style.display === 'block';

        if (isExpanded) {
            this._collapseSubcategories(subcategories, button);
        } else {
            this._expandSubcategories(subcategories, button);
        }
    }

    _onSubcategoryExpandClick(event) {
        event.stopPropagation();

        const button = event.currentTarget;
        const subcategoryGroup = button.closest('.subcategory-group');
        const subcategoryItems = subcategoryGroup.querySelector(this.options.subcategoryItemsSelector);

        if (!subcategoryItems) return;

        const isExpanded = subcategoryItems.style.display === 'block';

        if (isExpanded) {
            this._collapseSubcategoryItems(subcategoryItems, button);
        } else {
            this._expandSubcategoryItems(subcategoryItems, button);
        }
    }

    _expandSubcategories(subcategories, button) {
        const category = button.closest('.menu-category');

        // Добавляем полоску слева для выделения
        category.classList.add('expanded');

        subcategories.style.display = 'block';
        subcategories.style.opacity = '0';
        subcategories.style.transform = 'translateY(-10px)';

        // Обновляем иконку на "минус"
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;

        requestAnimationFrame(() => {
            subcategories.style.transition = 'all 0.3s ease';
            subcategories.style.opacity = '1';
            subcategories.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);

        this.$emitter.publish('subcategoriesExpanded', { subcategories, button });
    }

    _collapseSubcategories(subcategories, button) {
        const category = button.closest('.menu-category');

        // Убираем полоску слева
        category.classList.remove('expanded');

        subcategories.style.transition = 'all 0.3s ease';
        subcategories.style.opacity = '0';
        subcategories.style.transform = 'translateY(-10px)';

        // Обновляем иконку на "плюс"
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V14" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M2 8L14 8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;

        setTimeout(() => {
            subcategories.style.display = 'none';
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);

        this.$emitter.publish('subcategoriesCollapsed', { subcategories, button });
    }

    _expandSubcategoryItems(subcategoryItems, button) {
        const subcategoryGroup = button.closest('.subcategory-group');

        // Добавляем класс для выделения подгруппы
        subcategoryGroup.classList.add('expanded');

        subcategoryItems.style.display = 'block';
        subcategoryItems.style.opacity = '0';
        subcategoryItems.style.transform = 'translateY(-8px)';

        // Обновляем иконку стрелки
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 15L12 9L6 15"/>
            </svg>
        `;

        requestAnimationFrame(() => {
            subcategoryItems.style.transition = 'all 0.3s ease';
            subcategoryItems.style.opacity = '1';
            subcategoryItems.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);

        this.$emitter.publish('subcategoryItemsExpanded', { subcategoryItems, button });
    }

    _collapseSubcategoryItems(subcategoryItems, button) {
        const subcategoryGroup = button.closest('.subcategory-group');

        // Убираем класс выделения подгруппы
        subcategoryGroup.classList.remove('expanded');

        subcategoryItems.style.transition = 'all 0.3s ease';
        subcategoryItems.style.opacity = '0';
        subcategoryItems.style.transform = 'translateY(-8px)';

        // Обновляем иконку стрелки
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9L12 15L18 9"/>
            </svg>
        `;

        setTimeout(() => {
            subcategoryItems.style.display = 'none';
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);

        this.$emitter.publish('subcategoryItemsCollapsed', { subcategoryItems, button });
    }

    _onAddButtonClick(event) {
        event.stopPropagation();

        const button = event.currentTarget;
        const category = button.closest('.menu-category');
        const categoryId = category.dataset.categoryId;
        const categoryName = category.querySelector('.category-title').textContent;

        // Добавляем визуальную обратную связь
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

        // Прокручиваем к началу меню при сворачивании
        if (!this.isShowAllActive) {
            const menuContent = this.el.querySelector('.wow-menu-content');
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

    // Публичные методы для управления меню
    expandAllSubcategories() {
        // Раскрыть основные категории
        const expandButtons = this.el.querySelectorAll(this.options.expandButtonSelector);
        expandButtons.forEach(button => {
            const category = button.closest('.menu-category');
            const subcategories = category.querySelector(this.options.subcategoriesSelector);
            if (subcategories && subcategories.style.display !== 'block') {
                this._expandSubcategories(subcategories, button);
            }
        });

        // Раскрыть группы подкатегорий
        setTimeout(() => {
            const subcategoryExpandButtons = this.el.querySelectorAll(this.options.subcategoryExpandSelector);
            subcategoryExpandButtons.forEach(button => {
                const subcategoryGroup = button.closest('.subcategory-group');
                const subcategoryItems = subcategoryGroup.querySelector(this.options.subcategoryItemsSelector);
                if (subcategoryItems && subcategoryItems.style.display !== 'block') {
                    this._expandSubcategoryItems(subcategoryItems, button);
                }
            });
        }, 200);
    }

    collapseAllSubcategories() {
        // Свернуть группы подкатегорий
        const subcategoryExpandButtons = this.el.querySelectorAll(this.options.subcategoryExpandSelector);
        subcategoryExpandButtons.forEach(button => {
            const subcategoryGroup = button.closest('.subcategory-group');
            const subcategoryItems = subcategoryGroup.querySelector(this.options.subcategoryItemsSelector);
            if (subcategoryItems && subcategoryItems.style.display === 'block') {
                this._collapseSubcategoryItems(subcategoryItems, button);
            }
        });

        // Свернуть основные категории
        setTimeout(() => {
            const expandButtons = this.el.querySelectorAll(this.options.expandButtonSelector);
            expandButtons.forEach(button => {
                const category = button.closest('.menu-category');
                const subcategories = category.querySelector(this.options.subcategoriesSelector);
                if (subcategories && subcategories.style.display === 'block') {
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