/*  Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_debt_notebook_sync.tour', function (require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require('web.core');
    var _t = core._t;

    /* -----Actions----- */
    function open_pos_neworder() {
        return [{
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
            position: 'bottom',
        }, {
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
            position: "bottom"
        }, {
            content: "Switch to table or make dummy action",
            trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
            position: "bottom",
            timeout: 20000,
        }];
    }
    function create_new_order() {
        return [{
            content: 'Create new order',
            trigger: '.order-button.neworder-button',
        }];
    }
    function add_product_to_order(product_name) {
        return [{
            content: 'buy ' + product_name,
            trigger: '.product-list .product-name:contains("' + product_name + '")',
        }, {
            content: 'the ' + product_name + ' have been added to the order',
            trigger: '.order .product-name:contains("' + product_name + '")',
        }];
    }
    function switch_table() {
        return [{
            content: "Switch to table or make dummy action",
            trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
            position: "bottom",
        }];
    }
    function set_customer(name) {
        return [{
            trigger: '.button.js_set_customer',
            content: _t("Open the customer screen"),
        }, {
            trigger: 'td:contains(' + name + ')',
            content: _t("Click the customer"),
        }, {
            extra_trigger: '.button.next.highlight:contains("Set Customer")',
            trigger: '.button.next.highlight:contains("Set Customer")',
            content: 'Set Customer',
        }];
    }
    function click_to_payment() {
        return [{
            content: "Make a dummy action",
            trigger: '.order-button.selected',
        }, {
            trigger: '.button.pay',
            content: _t("Open the payment screen"),
        }, {
            content: "Choose Administrator like a cashier or make a dummy action",
            trigger: '.modal-dialog.cashier:not(.oe_hidden) .cashier .selection-item:contains("Administrator"), .payment-screen:not(.oe_hidden) h1:contains("Payment")',
        }];
    }
    function debt_method_paying(pay_method) {
        return [{
            extra_trigger: '.button.paymentmethod:contains("' + pay_method +'")',
            trigger: '.button.paymentmethod:contains("' + pay_method +'")',
            content: _t("Click the payment method"),
        }];
    }
    function validate_order() {
        return [{
            extra_trigger: '.button.next.highlight:contains("Validate")',
            trigger: '.button.next.highlight:contains("Validate")',
            content: 'Validate payment',
        }];
    }
    function click_numpad_input(char) {
        return [{
            trigger: '.input-button:contains("' + char +'")',
            content: _t("Click input on numpad"),
        }];
    }
    function next_order(){
        return [{
            trigger: '.button.next',
            content: _t("Next order"),
        }];
    }
    function set_numpad_value(value) {
        var steps = [];
        for (var i = 0; i < value.length; i++) {
            steps = steps.concat(click_numpad_input(value.charAt(i)));
       }
       return steps;
    }
    /* -----Scenarios----- */
    // Initial Test "Pay with all credit-journal"
    function initial_scene(steps, client) {
        return steps.concat(
            create_new_order(),
            add_product_to_order('Lemon'),
            click_to_payment(),
            set_customer(client),
            debt_method_paying('Credits (USD)'),
            set_numpad_value("1"),
            debt_method_paying('Credits (Fruits & Vegetables only) (USD)'),
            set_numpad_value("1"),
            debt_method_paying('Credits (via discounts) (USD)'),
            validate_order(),
            next_order(),
            switch_table()
        );
    }
    var steps = [];
    var client = "Agrolait";
    steps = steps.concat(open_pos_neworder());
    steps = initial_scene(steps, client);

    tour.register('tour_pos_debt_notebook_sync', { test: true, url: '/web' }, steps);

});
