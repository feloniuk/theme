const { Component } = Shopware;

Component.override('sw-cms-el-product-listing', {
  computed: {
    demoProductElement() {
      return {
        config: {
          boxLayout: {
            source: 'static',
            value: 'standard',
          },
          displayMode: {
            source: 'static',
            value: 'standard',
          },
        },
        data: {
          product: {
            name: 'Lorem Ipsum dolor',
            description: `Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                        sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
                        sed diam voluptua.`.trim(),
            price: [{ gross: 19.9 }],
            cover: {
              media: {
                url: '/administration/static/img/cms/preview_glasses_large.jpg',
                alt: 'Lorem Ipsum dolor',
              },
            },
          },
        },
      };
    },
  },
});
