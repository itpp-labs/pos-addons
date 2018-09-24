/*  Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_product_available_negative.tour', function (require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require('web.core');
    var _t = core._t;


    function open_pos_neworder() {
        return [{
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
            position: "bottom"
        }, {
            content: "Switch to table or make dummy action",
            trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
            position: "bottom"
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
            trigger: '.orderline:contains("' + product_name + '") .qty-info:contains("0")',
        }];
    }

    function change_cashier(cashier) {
        return [{
            content: 'open cashier selection popup',
            trigger: '.pos-branding span.username',
        }, {
            content: cashier + ' is selected',
            trigger: '.popup.popup-selection:contains("Change Cashier") div[data-item-index]:contains("' + cashier + '")',
        }];
    }

    function payment(cashier, pay_method) {
        return [{
            trigger: '.button.pay',
            content: _t("Open the payment screen"),
        }, {
            content: "Choose Administrator like a cashier or make a dummy action",
            trigger: '.modal-dialog.cashier:not(.oe_hidden) .cashier .selection-item:contains("' + cashier + '"), .payment-screen:not(.oe_hidden) h1:contains("Payment")'
        }, {
            extra_trigger: '.button.paymentmethod:contains("' + pay_method +'")',
            trigger: '.button.paymentmethod:contains("' + pay_method +'")',
            content: _t("Click the payment method"),
        }, {
            trigger: '.payment-screen .input-button.number-char:contains("5")',
            content: 'Set payment amount',
        }, {
            extra_trigger: '.button.next.highlight:contains("Validate")',
            trigger: '.button.next.highlight:contains("Validate")',
            content: 'Validate payment',
        }];
    }

    function check_popup() {

        return [{
            trigger: '.popup.popup-selection:contains("out-of-stock product"):not("oe_hidden") .button.cancel',
            content: _t("check restriction popup"),
        }];
    }

    var steps = [{
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
            position: 'bottom',
        }];

    steps = steps.concat(open_pos_neworder());
    steps = steps.concat(add_product_to_order('Yellow Peppers'));
    steps = steps.concat(change_cashier('Demo User'));
    steps = steps.concat(payment('Demo User', 'Cash (USD)'));
    steps = steps.concat(check_popup());

    tour.register('tour_pos_product_available_negative', { test: true, url: '/web' }, steps);

});
