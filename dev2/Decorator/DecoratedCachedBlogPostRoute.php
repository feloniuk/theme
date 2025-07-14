<?php declare(strict_types=1);

namespace MmTheme\Decorator;

use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\Framework\Adapter\Cache\AbstractCacheTracer;
use Shopware\Core\Framework\DataAbstractionLayer\Cache\EntityCacheKeyGenerator;
use Symfony\Component\Cache\Adapter\TagAwareAdapterInterface;
use NetzpBlog6\Controller\StoreApi\BlogPost\CachedBlogPostRoute;
use NetzpBlog6\Controller\StoreApi\BlogPost\BlogPostRouteResponse;

class DecoratedCachedBlogPostRoute extends CachedBlogPostRoute
{
    public function __construct(
        CachedBlogPostRoute $decorated,
        TagAwareAdapterInterface $cache,
        EntityCacheKeyGenerator $generator,
        AbstractCacheTracer $tracer,
        LoggerInterface $logger
    ) {
        parent::__construct(
            $decorated,
            $cache,
            $generator,
            $tracer,
            $logger
        );
    }

    public function load(string $postId, Criteria $criteria, SalesChannelContext $context): BlogPostRouteResponse
    {
        $criteria->addAssociation("author.customFields");

        return parent::load($postId, $criteria, $context);
    }
}
