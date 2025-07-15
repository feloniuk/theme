<?php declare(strict_types=1);

namespace MmTheme\Storefront\Controller;

use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;

#[Route(defaults: ['_routeScope' => ['storefront']])]
class ThemeController extends StorefrontController
{
  /**
   * @var SystemConfigService
   */
  private $configService;

  /**
   * @var LoggerInterface
   */
  private $logger;

  /**
   * Summary of __construct
   * @param LoggerInterface $logger
   * @param SystemConfigService $configService,
   */
  public function __construct(
    SystemConfigService $configService,
    LoggerInterface $logger
  ) {
    $this->configService = $configService;
    $this->logger = $logger;
  }

  #[Route(path: "/icons", name: "frontend.theme.icons", methods: ["GET"])]
  public function icons(): Response
  {
    return $this->renderStorefront('@MmTheme/storefront/page/theme/icons.html.twig');
  }
}
