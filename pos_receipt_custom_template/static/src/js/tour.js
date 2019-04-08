odoo.define('pos_receipt_custom_template.tour', function(require) {
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

    function cashier_select() {
        return [{
            trigger: '.modal-dialog.cashier .selection-item:contains("Mitchell Admin")',
            content: 'select first cashier',
        }];
    }

    function goto_payment_screen_and_select_payment_method() {
        var steps = [{
            trigger: '.button.pay',
            content: "go to payment screen",
        }];
        if (odoo._modules.indexOf('pos_cashier_select') !== -1) {
            steps = steps.concat(cashier_select());
        }
        steps = steps.concat([{
            trigger: '.paymentmethod:contains("Cash (USD)")',
            content: "pay with cash",
        }]);
        return steps;
    }

    function generate_keypad_steps(amount_str, keypad_selector) {
        var i = 0, steps = [], current_char = false;
        for (i = 0; i < amount_str.length; ++i) {
            current_char = amount_str[i];
            steps.push({
                trigger: keypad_selector + ' .input-button:contains("' + current_char + '"):visible',
                content: 'press ' + current_char + ' on payment keypad',
            });
        }

        return steps;
    }

    function generate_payment_screen_keypad_steps(amount_str) {
        return generate_keypad_steps(amount_str, '.payment-numpad');
    }

    function finish_order() {
        return [{
            trigger: '.button.next:visible',
            content: "validate the order",
        }, {
            trigger: ".js_connecting:visible",
            content: "verify that the order is being sent to the backend",
            run: function () {
                // it's a check
            },
        }, {
            trigger: ".js_connected:visible",
            content: "verify that the order has been succesfully sent to the backend",
            run: function () {
                // it's a check
            },
        }, {
            trigger: '.button.next:visible',
            content: "next order",
        }];
    }

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
    },{
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

    steps = steps.concat(goto_payment_screen_and_select_payment_method());

    steps = steps.concat(generate_payment_screen_keypad_steps("0.9"));

    steps = steps.concat(finish_order());

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

    tour.register('pos_receipt_custom_template_tour', {test: true, url: '/web' }, steps);
});
