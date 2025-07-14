<?php declare(strict_types=1);

namespace MmTheme\Decorator;

use Shopware\Core\System\Currency\CurrencyFormatter;
use Shopware\Core\System\Locale\LanguageLocaleCodeProvider;
use Shopware\Core\Framework\Context;

class DecoratedCurrencyFormatter extends CurrencyFormatter
{
    private CurrencyFormatter $decorated;

    public function __construct(CurrencyFormatter $decorated, LanguageLocaleCodeProvider $languageLocaleProvider)
    {
        $this->decorated = $decorated;
        parent::__construct($languageLocaleProvider);
    }

    public function formatCurrencyByLanguage(float $price, string $currency, string $languageId, Context $context, ?int $decimals = null): string
    {
        $currency = $this->decorated->formatCurrencyByLanguage($price, $currency, $languageId, $context, $decimals);

        return str_replace('US$', '$', $currency);
    }
}
