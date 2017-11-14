odoo.define('pos_mobile.tour', function(require) {
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

    function goto_payment_screen_and_select_payment_method() {
        return [{
            trigger: '.button.pay',
            content: "go to payment screen",
        }, {
            trigger: '.paymentmethod:contains("Cash")',
            content: "pay with cash",
        }];
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

    var steps = [{
        trigger: '.o_main_content:has(.loader:hidden)',
        content: 'waiting for loading to finish',
        run: function () {
            // it's a check
        },
    }];

    steps = steps.concat(add_product_to_order('Peaches'));

    steps = steps.concat({
        trigger: '.slide-numpad-button',
        content: "Open Numpad Menu",
        position: 'bottom',
    });

    steps = steps.concat(goto_payment_screen_and_select_payment_method());
    steps = steps.concat(generate_payment_screen_keypad_steps("5.10"));
    steps = steps.concat(finish_order());

    steps = steps.concat([{
        trigger: ".header-button",
        content: "close the Point of Sale frontend",
    }, {
        trigger: ".header-button.confirm",
        content: "confirm closing the frontend",
    }]);

    tour.register('pos_mobile_tour', { test: true, url: '/pos/web?m=1' }, steps);
});
