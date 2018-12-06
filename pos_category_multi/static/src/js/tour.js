odoo.define('pos_category_multi.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');

    var steps = [{
        trigger: '.o_main_content:has(.loader:hidden)',
        content: 'waiting for loading to finish',
        run: function () {
            // it's a check
        },
    }];

    steps = steps.concat({
        content: "Switch to table or make dummy action",
        trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
        position: "bottom"
    });

    steps = steps.concat([{
        trigger: ".category-simple-button:contains('Fruits and Vegetables')",
        content: "Click to Fruit Category",
    }, {
        trigger: ".product:contains('Boni Oranges')",
        content: "Check the product in the category",
        run: function () {
            // no need to click on trigger
        },
    }, {
        trigger: ".breadcrumb-button",
        content: "open Home category",
    }, {
        trigger: ".category-simple-button:contains('Partner Services')",
        content: "Click to Partner Category",
    }, {
        trigger: ".product:contains('Boni Oranges')",
        content: "Check the product in the category",
        run: function () {
            // no need to click on trigger
        },
    }]);

    steps = steps.concat([{
        trigger: ".header-button",
        content: "close the Point of Sale frontend",
    }, {
        trigger: ".header-button.confirm",
        content: "confirm closing the frontend",
    }, {
        content: "wait until backend is opened",
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        run: function () {
            // no need to click on trigger
        },
    }]);

    tour.register('pos_category_multi_tour', {test: true, url: '/pos/web' }, steps);
});
