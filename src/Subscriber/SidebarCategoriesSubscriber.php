<?php declare(strict_types=1);

namespace MmTheme\Subscriber;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\PageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

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
            'Shopware\Storefront\Page\PageLoadedEvent' => 'onPageLoaded',
        ];
    }

    public function onPageLoaded(PageLoadedEvent $event): void
    {
        $page = $event->getPage();
        $salesChannelContext = $event->getSalesChannelContext();
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        
        $sidebarEnabled = $this->systemConfigService->get('MmTheme.config.mm-sidebar-enabled', $salesChannelId);
        
        if (!$sidebarEnabled) {
            return;
        }

        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('customFields.mm_theme_sidebar_enabled', true));
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addAssociation('children.children');
        $criteria->addAssociation('parent');
        $criteria->addSorting(new FieldSorting('level', FieldSorting::ASCENDING));
        $criteria->addSorting(new FieldSorting('position', FieldSorting::ASCENDING));

        $categories = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());

        $sidebarCategories = $this->buildCategoryTree($categories->getEntities());

        $page->addExtension('sidebarCategories', $sidebarCategories);
        $page->addExtension('sidebarEnabled', true);
    }

    private function buildCategoryTree($categories): array
    {
        $tree = [];
        $categoryMap = [];

        foreach ($categories as $category) {
            $categoryMap[$category->getId()] = [
                'id' => $category->getId(),
                'name' => $category->getTranslated()['name'] ?? $category->getName(),
                'level' => $category->getLevel(),
                'parentId' => $category->getParentId(),
                'url' => $category->getExternalLink() ?: '/navigation/' . $category->getId(),
                'hasChildren' => false,
                'children' => [],
            ];
        }

        foreach ($categories as $category) {
            $categoryData = $categoryMap[$category->getId()];
            $parentId = $category->getParentId();

            if ($parentId && isset($categoryMap[$parentId])) {
                $categoryMap[$parentId]['children'][] = $categoryData;
                $categoryMap[$parentId]['hasChildren'] = true;
            } else {
                $tree[] = $categoryData;
            }
        }

        return $tree;
    }
}