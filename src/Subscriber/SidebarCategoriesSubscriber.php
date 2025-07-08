<?php declare(strict_types=1);

namespace MmTheme\Subscriber;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\Page;
use Shopware\Storefront\Page\PageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class SidebarCategoriesSubscriber implements EventSubscriberInterface
{
    private EntityRepositoryInterface $categoryRepository;
    private SystemConfigService $systemConfigService;

    public function __construct(
        EntityRepositoryInterface $categoryRepository,
        SystemConfigService $systemConfigService
    ) {
        $this->categoryRepository = $categoryRepository;
        $this->systemConfigService = $systemConfigService;
    }

    public static function getSubscribedEvents()
    {
        return [
            'Shopware\Storefront\Page\PageLoadedEvent' => 'onPageLoaded',
        ];
    }

    public function onPageLoaded(PageLoadedEvent $event)
    {
        $page = $event->getPage();
        $context = $event->getContext();
        $salesChannelId = $event->getSalesChannelContext()->getSalesChannel()->getId();
        
        // Проверяем, включен ли сайдбар в настройках плагина
        $sidebarEnabled = $this->systemConfigService->get('MmTheme.config.mm-sidebar-enabled', $salesChannelId);
        
        if (!$sidebarEnabled) {
            return;
        }
        
        // Получаем категории, отмеченные для показа в сайдбаре
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('customFields.mm_theme_sidebar_enabled', true));
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addAssociation('children');
        $criteria->addAssociation('media');
        $criteria->addSorting(new FieldSorting('position', FieldSorting::ASCENDING));
        $criteria->addSorting(new FieldSorting('name', FieldSorting::ASCENDING));
        
        $sidebarCategories = $this->categoryRepository->search($criteria, $context)->getEntities();
        
        $formattedCategories = [];
        foreach ($sidebarCategories as $category) {
            $customFields = $category->getCustomFields() ?? [];
            
            $categoryData = [
                'id' => $category->getId(),
                'name' => $category->getTranslated()['name'] ?? $category->getName(),
                'active' => $category->getActive(),
                'url' => '/category/' . $category->getId(),
                'hasChildren' => $category->getChildren() && $category->getChildren()->count() > 0,
                'children' => [],
            ];
            
            // Добавляем фоновое изображение, если есть
            if (isset($customFields['mm_theme_category_bg_image'])) {
                $categoryData['backgroundImage'] = $customFields['mm_theme_category_bg_image'];
            }
            
            // Добавляем медиа URL, если есть
            if ($category->getMedia()) {
                $categoryData['mediaUrl'] = $category->getMedia()->getUrl();
            }
            
            // Получаем дочерние категории, которые также отмечены для сайдбара
            if ($category->getChildren()) {
                foreach ($category->getChildren() as $child) {
                    $childCustomFields = $child->getCustomFields() ?? [];
                    
                    if (isset($childCustomFields['mm_theme_sidebar_enabled']) && 
                        $childCustomFields['mm_theme_sidebar_enabled'] === true && 
                        $child->getActive()) {
                        
                        $childData = [
                            'id' => $child->getId(),
                            'name' => $child->getTranslated()['name'] ?? $child->getName(),
                            'url' => '/category/' . $child->getId(),
                            'active' => $child->getActive(),
                        ];
                        
                        if ($child->getMedia()) {
                            $childData['mediaUrl'] = $child->getMedia()->getUrl();
                        }
                        
                        $categoryData['children'][] = $childData;
                    }
                }
            }
            
            $formattedCategories[] = $categoryData;
        }
        
        // Добавляем данные в страницу
        $page->addExtension('sidebarCategories', $formattedCategories);
        $page->addExtension('sidebarEnabled', true);
    }
}