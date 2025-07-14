<?php declare(strict_types=1);

namespace MmTheme\Subscriber;

use Shopware\Core\Content\Product\ProductEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\PageLoadedEvent;
use Shopware\Storefront\Page\Product\ProductPageLoadedEvent;
use Shopware\Storefront\Page\Navigation\NavigationPageLoadedEvent;
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
            NavigationPageLoadedEvent::class => 'onNavigationPageLoaded',
            ProductPageLoadedEvent::class => 'onProductPageLoaded',
        ];
    }

    public function onNavigationPageLoaded(NavigationPageLoadedEvent $event): void
    {
        $currentCategory = null;
        if (method_exists($event->getPage(), 'getCategory')) {
            $currentCategory = $event->getPage()->getCategory();
        }
        $this->handlePageLoaded($event, $currentCategory);
    }

    public function onProductPageLoaded(ProductPageLoadedEvent $event): void
    {
        $product = $event->getPage()->getProduct();
        $contextCategory = $this->getProductParentCategory($product, $event->getSalesChannelContext());
        $this->handlePageLoaded($event, $contextCategory);
    }

    private function handlePageLoaded(PageLoadedEvent $event, $currentCategory = null): void
    {
        $salesChannelContext = $event->getSalesChannelContext();
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        
        $sidebarEnabled = $this->systemConfigService->get('MmTheme.config.mm-sidebar-enabled', $salesChannelId);
        
        if (!$sidebarEnabled) {
            return;
        }

        // Получаем категории для сайдбара
        $sidebarCategories = $this->getSidebarCategories($salesChannelContext);
        
        // Определяем контекстную категорию
        $contextCategoryData = null;
        if ($currentCategory) {
            $contextCategoryData = $this->findRelevantGameCategory($currentCategory, $salesChannelContext);
        }

        $page = $event->getPage();
        
        // Используем assign для передачи переменных напрямую в Twig
        $page->assign([
            'sidebarCategories' => $sidebarCategories,
            'sidebarEnabled' => $sidebarEnabled,
            'contextCategory' => $contextCategoryData,
            'currentCategoryId' => $currentCategory ? $currentCategory->getId() : null
        ]);
    }

    private function getProductParentCategory(ProductEntity $product, SalesChannelContext $salesChannelContext)
    {
        $categories = $product->getCategories();
        if (!$categories || $categories->count() === 0) {
            return null;
        }

        // Ищем наиболее релевантную категорию (самую глубокую с включенным сайдбаром)
        $relevantCategory = null;
        $maxLevel = 0;

        foreach ($categories as $category) {
            $customFields = $category->getCustomFields() ?? [];
            if (
                isset($customFields['mm_theme_sidebar_enabled']) && 
                $customFields['mm_theme_sidebar_enabled'] === true &&
                $category->getLevel() > $maxLevel
            ) {
                $relevantCategory = $category;
                $maxLevel = $category->getLevel();
            }
        }

        return $relevantCategory;
    }

    private function findRelevantGameCategory($currentCategory, SalesChannelContext $salesChannelContext)
    {
        // Ищем категорию "Choose Game"
        $chooseGameCategory = $this->findCategoryByName('Choose Game', $salesChannelContext);
        if (!$chooseGameCategory) {
            return null;
        }

        // Ищем к какой игровой категории принадлежит текущая категория
        $gameCategories = $this->getGameCategories($chooseGameCategory->getId(), $salesChannelContext);
        
        return $this->findParentGameCategory($currentCategory, $gameCategories);
    }

    private function findCategoryByName(string $name, SalesChannelContext $salesChannelContext)
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('name', $name));
        $criteria->addFilter(new EqualsFilter('active', true));
        
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
        $criteria->addSorting(new FieldSorting('position', FieldSorting::ASCENDING));
        
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
        // Ищем категорию "Choose Game"
        $chooseGameCategory = $this->findCategoryByName('Choose Game', $salesChannelContext);
        if (!$chooseGameCategory) {
            return [];
        }

        // Получаем игровые категории
        $gameCategories = $this->getGameCategories($chooseGameCategory->getId(), $salesChannelContext);
        
        $formattedCategories = [];
        foreach ($gameCategories as $category) {
            $formattedCategories[] = $this->formatCategoryForSidebar($category);
        }

        return $formattedCategories;
    }

    private function formatCategoryForSidebar($category): array
    {
        $customFields = $category->getCustomFields() ?? [];
        $translated = $category->getTranslated();
        $name = $translated['name'] ?? $category->getName();
        
        $formattedCategory = [
            'id' => $category->getId(),
            'name' => $name,
            'level' => $category->getLevel(),
            'active' => $category->getActive(),
            'parentId' => $category->getParentId(),
            'url' => $category->getExternalLink() ?: '/navigation/' . $category->getId(),
            'hasChildren' => $category->getChildren() && $category->getChildren()->count() > 0,
            'children' => [],
            'customFields' => $customFields,
            'isBold' => $customFields['mm_theme_sidebar_bold'] ?? false,
        ];

        // Добавляем SVG иконку, если есть
        if (isset($customFields['mm_theme_sidebar_icon'])) {
            $formattedCategory['iconId'] = $customFields['mm_theme_sidebar_icon'];
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