odoo.define('pos_order_receipt_custom.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');

    function add_product_to_order(product_name) {
        return [{
            trigger: '.product-list .product-name:contains("' + product_name + '")',
            content: 'buy ' + product_name,
        }, {
            trigger: '.order .product-name:contains("' + product_name + '")',
            content: 'the ' + product_name + ' have been added to the order',
            run: function () {
                // it's a check
            },
        }];
    }

    function send_order_to_kitchen() {
        return [{
            trigger: '.order-submit',
            content: 'Send Order to Kitchen',
        }];
    }

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

    steps = steps.concat(add_product_to_order('LED Lamp'));

    steps = steps.concat(send_order_to_kitchen());

    steps = steps.concat([{
        trigger: '.order-submit:not(.highlight)',
        content: 'printing order',
        run: function () {
            // it's a check
        },
    }]);

    tour.register('pos_order_receipt_custom_tour', {test: true, url: '/pos/web' }, steps);
});
