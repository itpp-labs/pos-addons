odoo.define('pos_category_multi.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');

    var steps = [{
        trigger: '.o_main_content:has(.loader:hidden)',
        content: 'waiting for loading to finish',
        timeout: 20000,
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

    tour.register('pos_category_multi_tour', {test: true, url: '/pos/web' }, steps);
});
