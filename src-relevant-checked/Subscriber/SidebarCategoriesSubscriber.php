<?php declare(strict_types=1);

namespace MmTheme\Subscriber;

use Shopware\Core\Content\Product\ProductEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;
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

        if (!$sidebarEnabled) {
            return;
        }

        // Получаем текущую категорию
        $currentCategory = $this->getCurrentCategory($event);
        $currentCategoryId = $currentCategory ? $currentCategory->getId() : null;

        // Для страниц продуктов получаем категории продукта
        $productCategories = $this->getProductCategories($event);

        // Получаем все категории с включенным сайдбаром
        $sidebarCategoryIds = $this->getSidebarCategoryIds($salesChannelContext);

        // Передаем параметры в шаблон
        print_r($sidebarEnabled);
        exit();
        $event->setParameter('sidebarEnabled', $sidebarEnabled);
        $event->setParameter('sidebarCategoryIds', $sidebarCategoryIds);
        $event->setParameter('currentCategoryId', $currentCategoryId);
        $event->setParameter('productCategories', $productCategories);
    }

    private function getCurrentCategory(StorefrontRenderEvent $event)
    {
        $parameters = $event->getParameters();

        // Проверяем разные способы получения текущей категории
        if (isset($parameters['page'])) {
            $page = $parameters['page'];

            // Для страниц категорий
            if (method_exists($page, 'getCategory') && $page->getCategory()) {
                return $page->getCategory();
            }

            // Для CMS страниц
            if (method_exists($page, 'getCmsPage') && $page->getCmsPage()) {
                $cmsPage = $page->getCmsPage();
                if (method_exists($cmsPage, 'getCategories') && $cmsPage->getCategories()) {
                    return $cmsPage->getCategories()->first();
                }
            }
        }

        if (isset($parameters['category'])) {
            return $parameters['category'];
        }

        return null;
    }

    private function getProductCategories(StorefrontRenderEvent $event): array
    {
        $parameters = $event->getParameters();

        if (isset($parameters['page']) && method_exists($parameters['page'], 'getProduct')) {
            $product = $parameters['page']->getProduct();
            if ($product instanceof ProductEntity && $product->getCategories()) {
                return $product->getCategories()->getElements();
            }
        }

        return [];
    }

    private function getSidebarCategoryIds(SalesChannelContext $salesChannelContext): array
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addFilter(new EqualsFilter('customFields.mm_theme_sidebar_enabled', true));

        $categories = $this->categoryRepository->search($criteria, $salesChannelContext->getContext());

        $categoryIds = [];
        foreach ($categories as $category) {
            $categoryIds[] = $category->getId();
        }

        return $categoryIds;
    }
}