<?php declare(strict_types=1);

namespace MmTheme\Subscriber;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Storefront\Page\Page;
use Symfony\Component\HttpFoundation\JsonResponse;
use Shopware\Storefront\Page\PageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class GameCategoriesSubscriber implements EventSubscriberInterface
{
    private EntityRepository $categoryRepository;

    public function __construct(EntityRepository $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public static function getSubscribedEvents()
    {
        return [
            'Shopware\Storefront\Page\Home\HomePageLoadedEvent' => 'onHomePageLoaded',
        ];
    }

    public function onHomePageLoaded(PageLoadedEvent $event)
    {
        $page = $event->getPage();
        $salesChannel = $event->getSalesChannelContext()->getSalesChannel();

        // Получаем ID корневой категории игр из кастомных полей
        $rootGameCategoryId = $salesChannel->getCustomFields()['mm_root_games_category'] ?? '30131c331ce147b1934323b3abd0b448';

        if (!$rootGameCategoryId) {
            return;
        }

        // Получаем подкатегории
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('parentId', $rootGameCategoryId));
        $criteria->addAssociation('media');

        $categories = $this->getCategoriesByName("Choose Game");

        $formattedCategories = [];
        foreach ($categories as $category) {
            $formattedCategories[] = [
                'id' => $category->getId(),
                'name' => $category->getTranslated()['name'],
                'active' => $category->getActive(),
                'mediaUrl' => $category->getMedia() ? $category->getMedia()->getUrl() : null,
                'url' => '/category/' . $category->getId(),
            ];
        }

        // Добавляем данные категорий в страницу
        $page->addExtension('gameCategories', $formattedCategories);
    }

    public function getCategoriesByName($context): JsonResponse
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('name', 'Example Category'));

        $categories = $this->categoryRepository->search($criteria, $context);

        return new JsonResponse($categories);
    }
}