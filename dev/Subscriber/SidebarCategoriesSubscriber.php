<?php declare(strict_types=1);

namespace MmTheme\Subscriber;

use Shopware\Core\Content\Product\ProductEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Event\StorefrontRenderEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

class SidebarCategoriesSubscriber implements EventSubscriberInterface
{
    private EntityRepository $categoryRepository;
    private SystemConfigService $systemConfigService;

    public function __construct(
        EntityRepository $categoryRepository,
        SystemConfigService $systemConfigService
    ) {
        $this->categoryRepository = $categoryRepository;
        $this->systemConfigService = $systemConfigService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            StorefrontRenderEvent::class => 'onStorefrontRender',
        ];
    }

    public function onStorefrontRender(StorefrontRenderEvent $event): void
    {
        $salesChannelContext = $event->getSalesChannelContext();
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        
        // Проверяем настройку сайдбара
        $sidebarEnabled = $this->systemConfigService->get('MmTheme.config.mm-sidebar-enabled', $salesChannelId);
        
        // Получаем категории для сайдбара
        $sidebarCategories = $this->getSidebarCategories($salesChannelContext);
        
        // Определяем текущую категорию из параметров
        $currentCategory = $this->getCurrentCategory($event);
        
        // Определяем контекстную категорию
        $contextCategoryData = null;
        if ($currentCategory) {
            $contextCategoryData = $this->findRelevantGameCategory($currentCategory, $salesChannelContext);
        }

        // Создаем детальную отладочную информацию
        $debugInfo = $this->createDebugInfo($salesChannelContext, $currentCategory, $sidebarCategories, $contextCategoryData, $event);

        // Передаем данные через extensions
        $event->getContext()->addExtension('mm_sidebar_enabled', new ArrayStruct([
            'enabled' => $sidebarEnabled
        ]));
        
        $event->getContext()->addExtension('mm_sidebar_categories', new ArrayStruct([
            'categories' => $sidebarCategories
        ]));
        
        $event->getContext()->addExtension('mm_context_category', new ArrayStruct([
            'category' => $contextCategoryData
        ]));
        
        $event->getContext()->addExtension('mm_current_category_id', new ArrayStruct([
            'id' => $currentCategory ? $currentCategory->getId() : null
        ]));
        
        $event->getContext()->addExtension('mm_debug_info', new ArrayStruct([
            'info' => $debugInfo
        ]));
    }

    private function getCurrentCategory(StorefrontRenderEvent $event)
    {
        $parameters = $event->getParameters();
        
        // Проверяем разные способы получения текущей категории
        if (isset($parameters['page']) && method_exists($parameters['page'], 'getCategory')) {
            return $parameters['page']->getCategory();
        }
        
        if (isset($parameters['category'])) {
            return $parameters['category'];
        }
        
        // Для продуктов
        if (isset($parameters['page']) && method_exists($parameters['page'], 'getProduct')) {
            $product = $parameters['page']->getProduct();
            if ($product instanceof ProductEntity) {
                return $this->getProductParentCategory($product, $event->getSalesChannelContext());
            }
        }
        
        return null;
    }

    private function createDebugInfo(SalesChannelContext $salesChannelContext, $currentCategory, array $sidebarCategories, $contextCategoryData, $event): array
    {
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        $parameters = $event->getParameters();
        
        // Проверяем настройку сайдбара
        $sidebarSetting = $this->systemConfigService->get('MmTheme.config.mm-sidebar-enabled', $salesChannelId);
        
        // Получаем кастомное поле mm_root_games_category из sales_channel
        $salesChannelCustomFields = $salesChannelContext->getSalesChannel()->getCustomFields() ?? [];
        $customFieldValue = $salesChannelCustomFields['mm_root_games_category'] ?? null;
        
        // Получаем информацию о sales channel navigation
        $salesChannel = $salesChannelContext->getSalesChannel();
        $navigationCategoryId = $salesChannel->getNavigationCategoryId();
        $serviceCategoryId = $salesChannel->getServiceCategoryId();
        $footerCategoryId = $salesChannel->getFooterCategoryId();
        
        $salesChannelInfo = [
            'navigationCategoryId' => $navigationCategoryId,
            'serviceCategoryId' => $serviceCategoryId,
            'footerCategoryId' => $footerCategoryId,
            'name' => $salesChannel->getName(),
            'id' => $salesChannel->getId()
        ];
        
        // Получаем данные навигации из параметров - упрощенная версия
        $navigationInfo = [];
        if (isset($parameters['page']) && method_exists($parameters['page'], 'getHeader')) {
            $header = $parameters['page']->getHeader();
            if ($header && method_exists($header, 'getNavigation')) {
                $navigation = $header->getNavigation();
                if ($navigation) {
                    $navigationInfo = [
                        'navigationClass' => get_class($navigation),
                        'navigationMethods' => get_class_methods($navigation),
                        'hasNavigation' => true
                    ];
                    
                    // Не пытаемся получить children, так как метод требует аргументы
                    $navigationInfo['note'] = 'Tree object detected, getChildren() requires parameters';
                }
            }
        }
        
        // Получаем все категории разных уровней для отладки
        $allLevelsDebug = [];
        for ($level = 1; $level <= 4; $level++) {
            $criteria = new Criteria();
            $criteria->addFilter(new EqualsFilter('level', $level));
            $criteria->addFilter(new EqualsFilter('active', true));
            $criteria->addAssociation('children');
            $criteria->addSorting(new FieldSorting('name', FieldSorting::ASCENDING));
            $criteria->setLimit(10);
            
            $categoriesAtLevel = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());
            $levelArray = [];
            foreach ($categoriesAtLevel as $cat) {
                $levelArray[] = [
                    'id' => $cat->getId(),
                    'name' => $cat->getName(),
                    'level' => $cat->getLevel(),
                    'hasChildren' => $cat->getChildren() ? $cat->getChildren()->count() > 0 : false,
                    'customFields' => $cat->getCustomFields() ?? []
                ];
            }
            $allLevelsDebug["level_{$level}"] = $levelArray;
        }

        // Поиск различных вариантов категорий
        $searchNames = ['Choose Game', 'Games', 'Выберите игру', 'Игры', 'WoW', 'World of Warcraft'];
        $searchResults = [];
        
        foreach ($searchNames as $name) {
            $category = $this->findCategoryByName($name, $salesChannelContext);
            $searchResults[$name] = [
                'found' => $category !== null,
                'id' => $category ? $category->getId() : null,
                'level' => $category ? $category->getLevel() : null,
                'hasChildren' => $category && $category->getChildren() ? $category->getChildren()->count() > 0 : false
            ];
        }

        // Проверяем все theme конфигурации
        $themeConfigs = [];
        $configKeys = [
            'MmTheme.config.mm-sidebar-enabled',
            'MmTheme.config.mm-header-activator',
            'MmTheme.config.mm-games-activator'
        ];
        
        foreach ($configKeys as $key) {
            $themeConfigs[$key] = $this->systemConfigService->get($key, $salesChannelId);
        }

        return [
            'currentCategory' => $currentCategory ? [
                'id' => $currentCategory->getId(),
                'name' => $currentCategory->getName(),
                'level' => $currentCategory->getLevel(),
                'parentId' => $currentCategory->getParentId(),
                'breadcrumb' => method_exists($currentCategory, 'getBreadcrumb') ? $currentCategory->getBreadcrumb() : [],
                'customFields' => $currentCategory->getCustomFields() ?? []
            ] : null,
            'searchResults' => $searchResults,
            'customField' => $customFieldValue ?? 'NOT SET',
            'sidebarSetting' => $sidebarSetting,
            'salesChannelId' => $salesChannelId,
            'allLevelsDebug' => $allLevelsDebug,
            'themeConfigs' => $themeConfigs,
            'salesChannelCustomFields' => $salesChannelCustomFields,
            'salesChannelInfo' => $salesChannelInfo,
            'navigationInfo' => $navigationInfo,
            'parameters' => array_keys($parameters)
        ];
    }

    private function getProductParentCategory(ProductEntity $product, SalesChannelContext $salesChannelContext)
    {
        $categories = $product->getCategories();
        if (!$categories || $categories->count() === 0) {
            return null;
        }

        // Ищем наиболее релевантную категорию (самую глубокую)
        $relevantCategory = null;
        $maxLevel = 0;

        foreach ($categories as $category) {
            if ($category->getLevel() > $maxLevel) {
                $relevantCategory = $category;
                $maxLevel = $category->getLevel();
            }
        }

        return $relevantCategory;
    }

    private function findRelevantGameCategory($currentCategory, SalesChannelContext $salesChannelContext)
    {
        // Попробуем найти корневую категорию через разные способы
        $rootCategory = $this->findRootGamesCategory($salesChannelContext);
        
        if (!$rootCategory) {
            return null;
        }

        // Ищем к какой игровой категории принадлежит текущая категория
        $gameCategories = $this->getGameCategories($rootCategory->getId(), $salesChannelContext);

        return $this->findParentGameCategory($currentCategory, $gameCategories);
    }

    private function findRootGamesCategory(SalesChannelContext $salesChannelContext)
    {
        // 1. Проверяем кастомное поле mm_root_games_category в sales_channel
        $salesChannelCustomFields = $salesChannelContext->getSalesChannel()->getCustomFields() ?? [];
        $customFieldValue = $salesChannelCustomFields['mm_root_games_category'] ?? null;
        
        if ($customFieldValue) {
            $criteria = new Criteria([$customFieldValue]);
            $criteria->addFilter(new EqualsFilter('active', true));
            $criteria->addAssociation('children');
            $result = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());
            if ($result->first()) {
                return $result->first();
            }
        }

        // 2. Ищем по именам на всех уровнях
        $searchNames = ['Choose Game', 'Games', 'Выберите игру', 'Игры'];
        foreach ($searchNames as $name) {
            $category = $this->findCategoryByName($name, $salesChannelContext);
            if ($category && $category->getChildren() && $category->getChildren()->count() > 0) {
                return $category;
            }
        }

        // 3. Ищем любую категорию с детьми на уровне 2 или 3
        for ($level = 2; $level <= 3; $level++) {
            $criteria = new Criteria();
            $criteria->addFilter(new EqualsFilter('level', $level));
            $criteria->addFilter(new EqualsFilter('active', true));
            $criteria->addAssociation('children');
            
            $categories = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());
            
            $bestCandidate = null;
            $maxChildren = 0;
            
            foreach ($categories as $category) {
                if ($category->getChildren() && $category->getChildren()->count() > $maxChildren) {
                    $maxChildren = $category->getChildren()->count();
                    $bestCandidate = $category;
                }
            }
            
            if ($bestCandidate && $maxChildren > 0) {
                return $bestCandidate;
            }
        }

        return null;
    }

    private function findCategoryByName(string $name, SalesChannelContext $salesChannelContext)
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('name', $name));
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addAssociation('children');

        $result = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());
        return $result->first();
    }

    private function getGameCategories(string $parentId, SalesChannelContext $salesChannelContext)
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('parentId', $parentId));
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addAssociation('children.children.children');
        $criteria->addAssociation('media');

        return $this->categoryRepository->search($criteria, $salesChannelContext->getContext());
    }

    private function findParentGameCategory($currentCategory, $gameCategories)
    {
        $currentId = $currentCategory->getId();

        foreach ($gameCategories as $gameCategory) {
            if ($this->isCategoryInTree($currentId, $gameCategory)) {
                return $this->formatCategoryForSidebar($gameCategory);
            }
        }

        return null;
    }

    private function isCategoryInTree(string $searchId, $category): bool
    {
        if ($category->getId() === $searchId) {
            return true;
        }

        if ($category->getChildren()) {
            foreach ($category->getChildren() as $child) {
                if ($this->isCategoryInTree($searchId, $child)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function getSidebarCategories(SalesChannelContext $salesChannelContext): array
    {
        // Простой и прямой подход - ищем все категории с включенным сайдбаром
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addAssociation('children.children.children');
        $criteria->addAssociation('media');
        $criteria->addSorting(new FieldSorting('level', FieldSorting::ASCENDING));
        
        $allCategories = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());
        
        $sidebarCategories = [];
        
        foreach ($allCategories as $category) {
            $customFields = $category->getCustomFields() ?? [];
            
            // Ищем категории с включенным сайдбаром
            if (isset($customFields['mm_theme_sidebar_enabled']) && $customFields['mm_theme_sidebar_enabled']) {
                $sidebarCategories[] = $this->formatCategoryForSidebar($category);
            }
        }
        
        return $sidebarCategories;
    }

    private function formatCategoryForSidebar($category): array
    {
        $customFields = $category->getCustomFields() ?? [];
        
        // Используем translated как в мегаменю
        $translated = $category->getTranslated();
        $name = $translated['name'] ?? $category->getName();

        $formattedCategory = [
            'id' => $category->getId(),
            'name' => $name,
            'level' => $category->getLevel(),
            'active' => $category->getActive(),
            'parentId' => $category->getParentId(),
            'url' => '/navigation/' . $category->getId(),
            'hasChildren' => $category->getChildren() && $category->getChildren()->count() > 0,
            'children' => [],
            'customFields' => $customFields,
            'isBold' => $customFields['mm_theme_sidebar_bold'] ?? false,
        ];

        // Добавляем SVG иконку, если есть (используем translated как в мегаменю)
        $handler = $translated['customFields']['mm_theme_sidebar_icon'] ?? null;
        if ($handler) {
            $formattedCategory['iconId'] = $handler;
        }

        // Добавляем медиа URL, если есть
        if ($category->getMedia()) {
            $formattedCategory['mediaUrl'] = $category->getMedia()->getUrl();
        }

        // Определяем сложность для стилизации
        $nameLower = strtolower($name);
        if (strpos($nameLower, 'heroic') !== false) {
            $formattedCategory['difficulty'] = 'heroic';
        } elseif (strpos($nameLower, 'mythic') !== false) {
            $formattedCategory['difficulty'] = 'mythic';
        }

        // Добавляем бейдж, если есть
        if (strpos($name, 'Badge') !== false) {
            $formattedCategory['badge'] = 'Badge';
        }

        // Обрабатываем дочерние категории
        if ($category->getChildren()) {
            foreach ($category->getChildren() as $child) {
                $formattedCategory['children'][] = $this->formatCategoryForSidebar($child);
            }
        }

        return $formattedCategory;
    }
}