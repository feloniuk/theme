<?php declare(strict_types=1);

namespace MmTheme\Decorator;

use NetzpBlog6\Helper\BlogHelper;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\Routing\Annotation\Route;
use NetzpBlog6\Controller\StoreApi\BlogPost\BlogPostRoute;
use NetzpBlog6\Controller\StoreApi\BlogPost\BlogPostRouteResponse;

class DecoratedBlogPostRoute extends BlogPostRoute
{
    public function __construct(BlogHelper $helper)
    {
        parent::__construct($helper);
    }

    public function load(string $postId, Criteria $criteria, SalesChannelContext $context): BlogPostRouteResponse
    {
        $criteria->addAssociation("author.customFields");

        return parent::load($postId, $criteria, $context);
    }
}
