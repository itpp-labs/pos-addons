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
        }, {
            content: 'waiting for loading to finish',
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
    function set_customer(name) {
        return [{
            trigger: '.button.js_set_customer',
            content: _t("Open the customer screen"),
        }, {
            trigger: 'td:contains("' + name + '")',
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
    function close_error_modal_dialog() {
        return [{
            trigger: '.modal-dialog .button:contains("Ok")',
            content: _t("Close alert-dialog"),
        }];
    }
    function return_from_paying_to_menu() {
        return [{
            trigger: '.button:contains("Back")',
            content: _t("Return to pos-menu"),
        }];
    }
    function click_numpad_input(char) {
        return [{
            trigger: '.input-button:contains(' + char +')',
            content: _t("Click input on numpad"),
        }];
    }
    function click_numpad_mode(mode) {
        return [{
            trigger: '.mode-button:contains(' + mode +')',
            content: _t("Change numpad mode"),
        }];
    }
    function null_selected_product() {
        return [{
            trigger: '.numpad-backspace',
            content: _t("Clear property"),
        },{
            trigger: '.numpad-backspace',
            content: _t("Delete order"),
        }];
    }
    function next_order(){
        return [{
            trigger: '.button.next',
            content: _t("Next order"),
        }];
    }
    function set_numpad_value(steps, value) {
        for (var i = 0; i < value.length; i++) {
            steps = steps.concat(click_numpad_input(value.charAt(i)));
       }
       return steps;
    }
    /* -----Scenarios----- */
    // Initial Test
    function initial_scene(steps) {
        steps = steps.concat(add_product_to_order('Miscellaneous'));
        steps = steps.concat(click_to_payment());
        steps = steps.concat(set_customer('Agrolait'));
        steps = steps.concat(debt_method_paying('Credits (USD)'));
        steps = steps.concat(validate_order());
        steps = steps.concat(next_order());
        return steps;
    }
    // Error #1 from https://github.com/it-projects-llc/pos-addons/issues/592
    function scene1(steps) {
        steps = steps.concat(add_product_to_order("Miscellaneous"));
        steps = steps.concat(click_to_payment());
        steps = steps.concat(set_customer('Agrolait'));
        steps = steps.concat(debt_method_paying('Credits (USD)'));
        steps = steps.concat(deselect_customer());
        steps = steps.concat(validate_order());
        steps = steps.concat(close_error_modal_dialog());
        steps = steps.concat(return_from_paying_to_menu());
        steps = steps.concat(click_numpad_mode("Qty"));
        steps = steps.concat(null_selected_product());
        return steps;
    }
    // Error #4 from https://github.com/it-projects-llc/pos-addons/issues/592
    function scene4_1(steps) {
        steps = steps.concat(add_product_to_order("Miscellaneous"));
        steps = steps.concat(click_numpad_mode("Price"));
        steps = set_numpad_value(steps,"1000");
        steps = steps.concat(click_to_payment());
        steps = steps.concat(set_customer('Agrolait'));
        steps = steps.concat(debt_method_paying('Credits (USD)'));
        steps = set_numpad_value(steps,"1000");
        steps = steps.concat(validate_order());
        steps = steps.concat(close_error_modal_dialog());
        steps = steps.concat(deselect_customer());
        steps = steps.concat(return_from_paying_to_menu());
        steps = steps.concat(click_numpad_mode("Qty"));
        steps = steps.concat(null_selected_product());
        return steps;
    }
    // Scenario #1 from Error #4 from https://github.com/it-projects-llc/pos-addons/issues/592
    function scene4_2(steps) {
        steps = steps.concat(add_product_to_order("Pay Debt"));
        steps = steps.concat(click_to_payment());
        steps = steps.concat(set_customer('Agrolait'));
        steps = steps.concat(debt_method_paying('Cash (USD)'));
        steps = set_numpad_value(steps,"1000");
        steps = steps.concat(debt_method_paying('Credits (USD)'));
        steps = steps.concat(validate_order());
        steps = steps.concat(next_order());
        return steps;
    }
    // Scenario #2 from Error #4 from https://github.com/it-projects-llc/pos-addons/issues/592
    function scene4_3(steps) {
        steps = steps.concat(add_product_to_order("Pay Debt"));
        steps = steps.concat(click_to_payment());
        steps = steps.concat(set_customer('Agrolait'));
        steps = steps.concat(debt_method_paying('Credits (USD)'));
        steps = set_numpad_value(steps,"1000");
        steps = steps.concat(debt_method_paying('Credits (Fruits & Vegetables only) (USD)'));
        steps = steps.concat(validate_order());
        steps = steps.concat(next_order());
        return steps;
    }
    // Error #5 from https://github.com/it-projects-llc/pos-addons/issues/592
    function scene5(steps) {
        steps = steps.concat(add_product_to_order("Pay Debt"));
        steps = steps.concat(click_to_payment());
        steps = steps.concat(set_customer('Agrolait'));
        steps = steps.concat(debt_method_paying('Credits (Fruits & Vegetables only) (USD)'));
        steps = set_numpad_value(steps,"1000");
        steps = steps.concat(debt_method_paying('Credits (USD)'));
        steps = steps.concat(validate_order());
        steps = steps.concat(close_error_modal_dialog());
        steps = steps.concat(return_from_paying_to_menu());
        return steps;
    }

    var steps = [];
    steps = steps.concat(open_pos_neworder());
    steps = initial_scene(steps);
    // Fill the balance of credit
    steps = scene4_2(steps);
    // Proceed
    steps = scene1(steps);
    steps = scene4_1(steps);
    steps = scene4_2(steps);
    steps = scene4_3(steps);
    steps = scene5(steps);
    
    tour.register('tour_pos_debt_notebook', { test: true, url: '/web' }, steps);
});
