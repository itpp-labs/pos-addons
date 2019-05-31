odoo.define('pos_category_multi.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');

    var steps = [tour.STEPS.SHOW_APPS_MENU_ITEM, {
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
        position: 'right',
        edition: 'community'
    }, {
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
        position: 'bottom',
        edition: 'enterprise'
    }, {
        trigger: ".o_pos_kanban button.oe_kanban_action_button",
        content: "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
        position: "bottom"
    }];

    steps = steps.concat({
        content: "Switch to table or make dummy action",
        trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
        position: "bottom"
    });

    steps = steps.concat([{
        trigger: ".category-simple-button:contains('Chairs')",
        content: "Click to Chairs Category",
    }, {
        trigger: ".product:contains('LED Lamp')",
        content: "Check the product in the category",
        run: function () {
            // no need to click on trigger
        },
    }, {
        trigger: ".breadcrumb-button",
        content: "open Home category",
    }, {
        trigger: ".category-simple-button:contains('Desks')",
        content: "Click to Desks Category",
    }, {
        trigger: ".product:contains('LED Lamp')",
        content: "Check the product in the category",
        run: function () {
            // no need to click on trigger
        },
    }, {
        trigger: ".breadcrumb-button",
        content: "open Home category",
    }, {
        trigger: ".category-simple-button:contains('Miscellaneous')",
        content: "Click to Desks Category",
    }, {
        trigger: ".product:contains('LED Lamp')",
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
        trigger: '.o_pos_kanban button.oe_kanban_action_button',
        run: function () {
            // no need to click on trigger
        },
    }]);

    tour.register('pos_category_multi_tour', {test: true, url: '/web' }, steps);
});
