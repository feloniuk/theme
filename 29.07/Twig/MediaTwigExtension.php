<?php declare(strict_types=1);

namespace MmTheme\Twig;

use Shopware\Core\Content\Media\MediaCollection;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class MediaTwigExtension extends AbstractExtension
{
    private EntityRepository $mediaRepository;

    public function __construct(EntityRepository $mediaRepository)
    {
        $this->mediaRepository = $mediaRepository;
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('searchMedia', [$this, 'searchMedia']),
        ];
    }

    public function searchMedia(array $mediaIds, Context $context): MediaCollection
    {
        if (empty($mediaIds)) {
            return new MediaCollection();
        }

        $criteria = new Criteria();
        $criteria->addFilter(new EqualsAnyFilter('id', array_filter($mediaIds)));

        $result = $this->mediaRepository->search($criteria, $context);

        return $result->getEntities();
    }
}