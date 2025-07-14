<?php declare(strict_types=1);

namespace MmTheme\Decorator;

use Moorl\SignIn\Cart\CheckAddressCartProcessor;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\CartBehavior;
use Shopware\Core\Checkout\Cart\LineItem\CartDataCollection;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

class DecoratedCheckAddressCartProcessor extends CheckAddressCartProcessor
{
  public function process(
    CartDataCollection $data,
    Cart $original,
    Cart $toCalculate,
    SalesChannelContext $salesChannelContext,
    CartBehavior $behavior
  ): void {
  }
}
