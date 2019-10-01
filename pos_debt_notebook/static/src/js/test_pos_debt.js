/* Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
 odoo.define('pos_debt_notebook.tour', function (require) {
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
    function deselect_customer() {
        return [{
            trigger: '.button.js_set_customer',
            content: _t("Open the customer screen"),
        }, {
            trigger: '.button:contains("Deselect")',
            content: _t("Deselect the customer"),
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
    function close_error_modal_dialog(message) {
        return [{
            trigger: '.popup>.body:contains("' + message +'")',
            content: _t("check error-message"),
        },{
            trigger: '.modal-dialog .button:contains("Ok")',
            content: _t("Close alert-dialog"),
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
    function remove_paymentline(){
        return [{
            trigger: '.paymentline>.delete-button',
            content: _t("delete selected payment-line"),
        }];
    }
    function click_autopay_button(){
        return [{
            trigger: '.autopay',
            content: _t("click autopay-button"),
        }];
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
    // Error: "You cannot use Debt payment. Select customer first."
    function scene_1(steps, client, err_msg) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Miscellaneous"),
            click_to_payment(),
            set_customer(client),
            debt_method_paying('Credits (USD)'),
            deselect_customer(),
            validate_order(),
            close_error_modal_dialog(err_msg)
        );
    }
    // Error:  "You cannot sell products on credit to the customer because his max debt value will be exceeded."
    function scene_2(steps, client, err_msg) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Miscellaneous"),
            click_to_payment(),
            set_customer(client),
            debt_method_paying('Credits (USD)'),
            set_numpad_value("10000"),
            validate_order(),
            close_error_modal_dialog(err_msg)
        );
    }
    // Scenario: Increase credit amount
    function scene_3(steps, client) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Pay Debt"),
            click_to_payment(),
            set_customer(client),
            debt_method_paying('Cash (USD)'),
            set_numpad_value("4"),
            debt_method_paying('Credits (USD)'),
            validate_order(),
            next_order(),
            switch_table()
        );
    }
    // Scenario: Transfer money from Credit to Credit (Fruit&Vegetables only)
    function scene_4(steps, client) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Pay Debt"),
            click_to_payment(),
            set_customer(client),
            debt_method_paying('Credits (USD)'),
            set_numpad_value("2"),
            debt_method_paying('Credits (Fruits & Vegetables only) (USD)'),
            validate_order(),
            next_order(),
            switch_table()
        );
    }
    // Error: "Please enter the exact or lower debt amount than the cost of the order"
    function scene_5(steps, client, err_msg) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Pay Debt"),
            click_to_payment(),
            set_customer(client),
            debt_method_paying('Credits (Fruits & Vegetables only) (USD)'),
            set_numpad_value("1"),
            debt_method_paying('Credits (USD)'),
            validate_order(),
            close_error_modal_dialog(err_msg)
        );
    }
    // Error: "You may only buy Fruits and Vegetables with Credits (Fruits & Vegetables only) (USD)"
    function scene_6(steps, client, err_msg) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Miscellaneous"),
            click_to_payment(),
            set_customer(client),
            remove_paymentline(),
            debt_method_paying('Credits (Fruits & Vegetables only) (USD)'),
            set_numpad_value("1"),
            validate_order(),
            close_error_modal_dialog(err_msg)
        );
    }
    // Scenario: Proceed order with autopay-button (bottom-left corner)
    function scene_7(steps, client) {
        return steps.concat(
            create_new_order(),
            add_product_to_order("Miscellaneous"),
            click_to_payment(),
            set_customer(client),
            remove_paymentline(),
            debt_method_paying('Credits (via discounts) (USD)'),
            set_numpad_value("1"),
            click_autopay_button(),
            click_autopay_button()
        );
    }

    var steps = [];
    var client = "Agrolait";
    var err_msgs = [
        "You cannot use Debt payment. Select customer first.",
        "You cannot sell products on credit journal Credits (USD) to the customer because its max debt value will be exceeded.",
        "Please enter the exact or lower debt amount than the cost of the order.",
        "You may only buy Fruits and Vegetables with Credits (Fruits & Vegetables only) (USD)",
    ];

    steps = steps.concat(open_pos_neworder());
    steps = initial_scene(steps, client);
    steps = scene_1(steps, client, err_msgs[0]);
    steps = scene_2(steps, client, err_msgs[1]);
    steps = scene_3(steps, client);
    steps = scene_4(steps, client);
    steps = scene_5(steps, client, err_msgs[2]);
    steps = scene_6(steps, client, err_msgs[3]);
    steps = scene_7(steps, client);

    tour.register('tour_pos_debt_notebook', { test: true, url: '/web' }, steps);
});
