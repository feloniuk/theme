<?php declare(strict_types=1);

namespace MmTheme;

use Shopware\Core\Framework\Plugin;
use Shopware\Storefront\Framework\ThemeInterface;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\System\CustomField\CustomFieldTypes;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\Config\Loader\DelegatingLoader;
use Symfony\Component\Config\Loader\LoaderResolver;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\DirectoryLoader;
use Symfony\Component\DependencyInjection\Loader\GlobFileLoader;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;


class MmTheme extends Plugin implements ThemeInterface
{
    public function getThemeConfigPath(): string
    {
        return 'theme.json';
    }

    private $groups = [
        'custom_product_offer',
        'product_offer',
        'custom_product_coins',
        'custom_footer',
        'custom_coins',
        'custom_reviews',
        'product_options',
        'mm_theme_category_bg',
        'mm_theme_customer',
        'mm_blog_author',
        'custom_category_homepage',
        'mm_root_games_category',
        "mm_theme_customer_technical"
    ];

    private $fields = [
        [
            'name' => 'custom_category_homepage',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Category For Homepage'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'category'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'custom_category_homepage_view',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Show Category on Homepage'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'custom_category_homepage_feature',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Show like Feature'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 0,
                    ]
                ],
                 [
                     'name' => 'custom_category_homepage_best',
                     'type' => CustomFieldTypes::BOOL,
                     'config' => [
                         'label' => [
                             'en-GB' => 'Best Sellers'
                         ],
                         'type' => 'checkbox',
                         'customFieldType' => 'checkbox',
                         'componentName' => 'sw-switch-field',
                         'customFieldPosition' => 0,
                     ]
                 ],
                [
                    'name' => 'custom_category_homepage_sale',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => '% Sale'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'custom_category_homepage_icon',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Category Homepage Icon'
                        ],
                        'componentName' => 'sw-media-field',
                        'customFieldType' => 'media',
                        'customFieldPosition' => 1,
                    ]
                ],
                [
                    'name' => 'custom_category_homepage_title',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Category Homepage Title'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 5,
                    ]
                ],
                [
                    'name' => 'custom_category_homepage_subtitle',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Category Homepage Subtitle'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 5,
                    ]
                ],
                [
                    'name' => 'custom_category_homepage_image',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Category Homepage Image'
                        ],
                        'type' => 'checkbox',
                        'componentName' => 'sw-media-field',
                        'customFieldType' => 'media',
                        'customFieldPosition' => 2,
                    ]
                ],
            ]
        ],
        [
            'name' => 'mm_blog_author',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Blog author'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 's_plugin_netzp_blog_author',
                ]
            ],
            'customFields' => [
                [
                    'name' => 'mm_theme_blog_author_url',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'URL'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 0,
                    ]
                ]
            ]
        ],
        [
            'name' => 'mm_theme_customer',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Contacts'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'customer',
                ]
            ],
            'customFields' => [
                [
                    'name' => 'mm_theme_customer_whatsapp',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Whatsapp'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'mm_theme_customer_email',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Email'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 1,
                    ]
                ],
                [
                    'name' => 'mm_theme_customer_battletag',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'BattleTag'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 2,
                    ]
                ],
                [
                    'name' => 'mm_theme_customer_discord',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Discord'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 3,
                    ]
                ],
                [
                    'name' => 'mm_theme_customer_telegram',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Telegram'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 4,
                    ]
                ],
                [
                    'name' => 'mm_theme_customer_skype',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Skype'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 5,
                    ]
                ]
            ]
        ],
        [
            'name' => 'mm_theme_customer_technical',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Technical'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'customer',
                ]
            ],
            'customFields' => [
                [
                    'name' => 'mm_theme_developer',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Is developer'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 0,
                    ]
                ],
            ]
        ],
        [
            'name' => 'mm_theme_category_bg',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Sidebar & Display'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'category',
                ],
                [
                    'entityName' => 'sales_channel',
                ],
            ],
            'customFields' => [
                [
                    'name' => 'mm_theme_sidebar_enabled',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Show in Sidebar'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 1,
                    ]
                ],
                [
                    'name' => 'mm_theme_sidebar_bold',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Display Bold in Sidebar'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 2,
                    ]
                ],
                [
                    'name' => 'mm_theme_sidebar_icon',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Sidebar Icon (SVG)'
                        ],
                        'componentName' => 'sw-media-field',
                        'customFieldType' => 'media',
                        'customFieldPosition' => 3,
                    ]
                ],
            ]
        ],
        [
            'name' => 'custom_product_offer',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Product Offer'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'product'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'custom_offer_enabled',
                    'type' => CustomFieldTypes::BOOL,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Offer Mode Enabled'
                        ],
                        'type' => 'checkbox',
                        'customFieldType' => 'checkbox',
                        'componentName' => 'sw-switch-field',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'custom_offer_datetime',
                    'type' => CustomFieldTypes::DATETIME,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Offer Mode Enabled'
                        ],
                        'type' => 'date',
                        'dateType' => 'datetime',
                        'customFieldType' => 'date',
                        'customFieldPosition' => 1,
                    ]
                ],
            ]
        ],
        [
            'name' => 'product_options',
            'config' => [
                'label' => [
                    'en-GB' => 'Additional Options'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'product'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'product_seo_name',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'SEO product name'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 9,
                    ]
                ],
                [
                    'name' => 'product_tabs_youtube_id',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Youtube Video ID'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 10,
                    ]
                ],
                [
                    'name' => 'product_badge',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Card Badge'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 11,
                    ]
                ],
                [
                    'name' => 'product_badge_background_color',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Card Badge Bg Color'
                        ],
                        'componentName' => 'sw-colorpicker',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 12,
                    ]
                ],
                [
                    'name' => 'product_badge_text_color',
                    'type' => CustomFieldTypes::TEXT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Card Badge Text Color'
                        ],
                        'componentName' => 'sw-colorpicker',
                        'customFieldType' => 'text',
                        'customFieldPosition' => 13,
                    ]
                ],
                [
                    'name' => 'product_spotlight',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Card Spotlight'
                        ],
                        'componentName' => 'sw-text-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 14,
                    ]
                ],
            ]
        ],
        [
            'name' => 'custom_reviews',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Reviews'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'sales_channel'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'custom_tp_widget',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'TP Widget'
                        ],
                        'componentName' => 'sw-code-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 2,
                    ]
                ],
                [
                    'name' => 'custom_reviews_count',
                    'type' => CustomFieldTypes::INT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Reviews Count'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'number',
                        'customFieldPosition' => 0,
                        'numberType' => 'int'
                    ]
                ],
                [
                    'name' => 'custom_reviews_rating',
                    'type' => CustomFieldTypes::FLOAT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Reviews Rating'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'number',
                        'customFieldPosition' => 1,
                        'numberType' => 'float'
                    ]
                ],
            ]
        ],
        [
            'name' => 'custom_footer',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Footer Options'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'sales_channel'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'custom_footer_messengers',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Messengers'
                        ],
                        'componentName' => 'sw-code-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'custom_footer_feedback_rating',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Feedback Rating Widgets'
                        ],
                        'componentName' => 'sw-code-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 1,
                    ]
                ],
            ]
        ],
        [
            'name' => 'custom_coins',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Coins'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'sales_channel'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'custom_coins_rate',
                    'type' => CustomFieldTypes::FLOAT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Coins Rate (amount of Coins per one euro)'
                        ],
                        'placeholder' => [
                            'en-GB' => '100'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'number',
                        'customFieldPosition' => 1,
                        'numberType' => 'float',
                    ]
                ],
                [
                    'name' => 'custom_coins_write_off_rate',
                    'type' => CustomFieldTypes::FLOAT,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Global Coins Write-off Rate'
                        ],
                        'placeholder' => [
                            'en-GB' => '100'
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'number',
                        'customFieldPosition' => 2,
                        'numberType' => 'float',
                    ]
                ]
            ]
        ],
        [
            'name' => 'mm_root_games_category',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Root Games Category'
                ]
            ],
            'relations' => [
                [
                    'entityName' => 'sales_channel'
                ]
            ],
            'customFields' => [
                [
                    'name' => 'mm_root_games_category',
                    'type' => CustomFieldTypes::ENTITY,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Root category'
                        ],
                        'placeholder' => [
                            'en-GB' => 'Root category'
                        ],
                        'componentName' => 'sw-entity-single-select',
                        'entity' => 'category',
                        'customFieldPosition' => 1
                    ]
                ]
            ]
        ],
    ];

    private function removeFields($context): void
    {
        /** @var EntityRepository $customFieldSetRepository */
        $customFieldSetRepository = $this->container->get('custom_field_set.repository');

        $criteria = (new Criteria())->addFilter(new EqualsAnyFilter('name', $this->groups));
        $results = $customFieldSetRepository->search($criteria, $context->getContext())->getEntities();

        $ids = [];

        foreach ($results as $result) {
            $id = ['id' => $result->get('id')];

            array_push($ids, $id);
        }

        $customFieldSetRepository->delete($ids, $context->getContext());
    }

    private function addFields($context): void
    {
        /** @var EntityRepository $customFieldSetRepository */
        $customFieldSetRepository = $this->container->get('custom_field_set.repository');

        $customFieldsGroups = $this->getAllCustomFieldsGroups();
        $addedCustomFieldsGroups = [];
        foreach ($customFieldsGroups as $group) {
            if (!$this->customFieldGroupIsExist($group['name'], $context)) {
                array_push($addedCustomFieldsGroups, $group);
            }
        }

        if ($addedCustomFieldsGroups) {
            $customFieldSetRepository->create($addedCustomFieldsGroups, $context->getContext());
        }
    }

    public function activate(ActivateContext $context): void
    {
        $this->addFields($context);

        parent::activate($context);
    }

    public function update(UpdateContext $context): void
    {
        $this->removeFields($context);
        $this->addFields($context);

        parent::update($context);
    }

    public function deactivate(DeactivateContext $context): void
    {
        $this->removeFields($context);

        parent::deactivate($context);
    }

    public function uninstall(UninstallContext $context): void
    {
        $this->removeFields($context);

        parent::uninstall($context);
    }

    private function customFieldGroupIsExist(string $name, $context)
    {
        $customFieldSetRepository = $this->container->get('custom_field_set.repository');
        $criteria = (new Criteria())->addFilter(new EqualsFilter('name', $name));
        $results = $customFieldSetRepository->search($criteria, $context->getContext())->getEntities()->first();

        return $results;
    }

    private function getAllCustomFieldsGroups()
    {
        return $this->fields;
    }

    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $locator = new FileLocator('Resources/config');

        $resolver = new LoaderResolver([
            new YamlFileLoader($container, $locator),
            new GlobFileLoader($container, $locator),
            new DirectoryLoader($container, $locator),
        ]);

        $configLoader = new DelegatingLoader($resolver);

        $confDir = \rtrim($this->getPath(), '/') . '/Resources/config';

        $configLoader->load($confDir . '/{packages}/*.yaml', 'glob');
    }
}