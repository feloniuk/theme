<?php declare(strict_types=1);

namespace MmTheme\Service;

use Shopware\Core\Content\Category\CategoryEntity;
use Shopware\Core\Content\Category\CategoryCollection;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\NotFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

class SidebarCategoryService
{
    private EntityRepository $categoryRepository;

    public function __construct(EntityRepository $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public function getSidebarCategories(SalesChannelContext $salesChannelContext): array
    {
        $context = $salesChannelContext->getContext();
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();

        // Получаем все категории, отмеченные для сайдбара
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('customFields.mm_theme_sidebar_enabled', true));
        $criteria->addFilter(new EqualsFilter('active', true));
        $criteria->addFilter(new EqualsFilter('type', 'page')); // Только страницы категорий
        $criteria->addFilter(new NotFilter(NotFilter::CONNECTION_AND, [
            new EqualsFilter('parentId', null) // Исключаем корневые категории
        ]));
        
        // Добавляем ассоциации для получения полной информации
        $criteria->addAssociation('parent');
        $criteria->addAssociation('parent.parent');
        $criteria->addAssociation('children');
        $criteria->addAssociation('media');
        
        // Сортировка
        $criteria->addSorting(new FieldSorting('level', FieldSorting::ASCENDING));
        $criteria->addSorting(new FieldSorting('position', FieldSorting::ASCENDING));
        $criteria->addSorting(new FieldSorting('name', FieldSorting::ASCENDING));

        $categories = $this->categoryRepository->search($criteria, $context);

        return $this->buildCategoryTree($categories->getEntities());
    }

    private function buildCategoryTree(CategoryCollection $categories): array
    {
        $tree = [];
        $categoryMap = [];

        // Создаем карту категорий для быстрого доступа
        foreach ($categories as $category) {
            $categoryMap[$category->getId()] = $this->formatCategory($category);
        }

        // Строим дерево
        foreach ($categories as $category) {
            $formattedCategory = $categoryMap[$category->getId()];
            
            // Определяем уровень категории
            $level = $category->getLevel();
            $parentId = $category->getParentId();

            if ($level === 2) {
                // Категории второго уровня - корневые для сайдбара
                $tree[$category->getId()] = $formattedCategory;
            } elseif ($level === 3 && $parentId && isset($categoryMap[$parentId])) {
                // Категории третьего уровня - дочерние для второго
                $parentCategory = $this->findCategoryInTree($tree, $parentId);
                if ($parentCategory !== null) {
                    $parentCategory['children'][] = $formattedCategory;
                    $parentCategory['hasChildren'] = true;
                    $this->updateCategoryInTree($tree, $parentId, $parentCategory);
                }
            } elseif ($level === 4 && $parentId && isset($categoryMap[$parentId])) {
                // Категории четвертого уровня - подкатегории для третьего
                $parentCategory = $this->findCategoryInTreeRecursive($tree, $parentId);
                if ($parentCategory !== null) {
                    if (!isset($parentCategory['children'])) {
                        $parentCategory['children'] = [];
                    }
                    $parentCategory['children'][] = $formattedCategory;
                    $parentCategory['hasChildren'] = true;
                    $this->updateCategoryInTreeRecursive($tree, $parentId, $parentCategory);
                }
            }
        }

        return array_values($tree);
    }

    private function formatCategory(CategoryEntity $category): array
    {
        $customFields = $category->getCustomFields() ?? [];
        $name = $category->getTranslated()['name'] ?? $category->getName();
        
        $formattedCategory = [
            'id' => $category->getId(),
            'name' => $name,
            'level' => $category->getLevel(),
            'active' => $category->getActive(),
            'parentId' => $category->getParentId(),
            'url' => $category->getExternalLink() ?: '/category/' . $category->getId(),
            'hasChildren' => false,
            'children' => [],
            'customFields' => $customFields,
        ];

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

        return $formattedCategory;
    }

    private function findCategoryInTree(array &$tree, string $categoryId): ?array
    {
        foreach ($tree as $key => $category) {
            if ($category['id'] === $categoryId) {
                return $category;
            }
        }
        return null;
    }

    private function updateCategoryInTree(array &$tree, string $categoryId, array $updatedCategory): void
    {
        foreach ($tree as $key => $category) {
            if ($category['id'] === $categoryId) {
                $tree[$key] = $updatedCategory;
                return;
            }
        }
    }

    private function findCategoryInTreeRecursive(array &$tree, string $categoryId): ?array
    {
        foreach ($tree as $category) {
            if ($category['id'] === $categoryId) {
                return $category;
            }
            
            if (!empty($category['children'])) {
                $found = $this->findCategoryInTreeRecursive($category['children'], $categoryId);
                if ($found !== null) {
                    return $found;
                }
            }
        }
        return null;
    }

    private function updateCategoryInTreeRecursive(array &$tree, string $categoryId, array $updatedCategory): void
    {
        foreach ($tree as $key => $category) {
            if ($category['id'] === $categoryId) {
                $tree[$key] = $updatedCategory;
                return;
            }
            
            if (!empty($category['children'])) {
                $this->updateCategoryInTreeRecursive($tree[$key]['children'], $categoryId, $updatedCategory);
            }
        }
    }
}