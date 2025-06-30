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
        subcategories.style.display = 'block';
        subcategories.style.opacity = '0';
        subcategories.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            subcategories.style.transition = 'all 0.3s ease';
            subcategories.style.opacity = '1';
            subcategories.style.transform = 'translateY(0)';
        });
        
        button.style.transform = 'rotate(180deg)';
        
        setTimeout(() => {
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);

        this.$emitter.publish('subcategoriesExpanded', { subcategories, button });
    }

    _collapseSubcategories(subcategories, button) {
        subcategories.style.transition = 'all 0.3s ease';
        subcategories.style.opacity = '0';
        subcategories.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            subcategories.style.display = 'none';
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);
        
        button.style.transform = 'rotate(0deg)';

        this.$emitter.publish('subcategoriesCollapsed', { subcategories, button });
    }

    _expandSubcategoryItems(subcategoryItems, button) {
        subcategoryItems.style.display = 'block';
        subcategoryItems.style.opacity = '0';
        subcategoryItems.style.transform = 'translateY(-8px)';
        
        requestAnimationFrame(() => {
            subcategoryItems.style.transition = 'all 0.3s ease';
            subcategoryItems.style.opacity = '1';
            subcategoryItems.style.transform = 'translateY(0)';
        });
        
        button.style.transform = 'rotate(180deg)';
        
        setTimeout(() => {
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);

        this.$emitter.publish('subcategoryItemsExpanded', { subcategoryItems, button });
    }

    _collapseSubcategoryItems(subcategoryItems, button) {
        subcategoryItems.style.transition = 'all 0.3s ease';
        subcategoryItems.style.opacity = '0';
        subcategoryItems.style.transform = 'translateY(-8px)';
        
        setTimeout(() => {
            subcategoryItems.style.display = 'none';
            if (this.swiper) {
                this.swiper.update();
            }
        }, 300);
        
        button.style.transform = 'rotate(0deg)';

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
        const button = event.currentTarget;
        const icon = button.querySelector('svg');
        
        if (icon) {
            const currentRotation = icon.style.transform;
            icon.style.transform = currentRotation === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
        }

        this.$emitter.publish('showAllButtonClicked', { button });
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