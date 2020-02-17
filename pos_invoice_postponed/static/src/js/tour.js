/*  Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License MIT (https://opensource.org/licenses/MIT).*/
odoo.define("pos_invoice_postponed.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    function pos_opening() {
        return [
            {
                trigger:
                    '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content: _t(
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>."
                ),
                position: "bottom",
            },
            {
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content: _t(
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"
                ),
                position: "bottom",
            },
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
                position: "bottom",
                timeout: 30000,
            },
        ];
    }

    function add_product_to_order(product_name) {
        return [
            {
                content: "buy " + product_name,
                trigger: '.product-list .product-name:contains("' + product_name + '")',
            },
            {
                content: "the " + product_name + " have been added to the order",
                trigger: '.order .product-name:contains("' + product_name + '")',
            },
        ];
    }

    function set_customer(name) {
        return [
            {
                trigger: ".button.set-customer",
                content: _t("Open the customer screen"),
            },
            {
                trigger: 'td:contains("' + name + '")',
                content: _t("Click the customer"),
            },
            {
                extra_trigger: '.button.next.highlight:contains("Set Customer")',
                trigger: '.button.next.highlight:contains("Set Customer")',
                content: "Set Customer",
            },
        ];
    }

    function payment(pay_method) {
        return [
            {
                content: "Make a dummy action",
                trigger: ".order-button.selected",
            },
            {
                trigger: ".button.pay",
                content: _t("Open the payment screen"),
            },
            {
                content: "Choose Demo like a cashier or make a dummy action",
                trigger:
                    '.modal-dialog.cashier:not(.oe_hidden) .cashier .selection-item:contains("Demo"), .payment-screen:not(.oe_hidden) h1:contains("Payment")',
            },
            {
                extra_trigger: '.button.paymentmethod:contains("' + pay_method + '")',
                trigger: '.button.paymentmethod:contains("' + pay_method + '")',
                content: _t("Click the payment method"),
            },
            {
                content: "Choose Admin to proceed payment",
                trigger:
                    '.modal-dialog.cashier:not(.oe_hidden) .cashier .selection-item:contains("Admin"), .payment-screen:not(.oe_hidden) h1:contains("Payment")',
            },
            {
                extra_trigger: '.button.next.highlight:contains("Validate")',
                trigger: '.button.next.highlight:contains("Validate")',
                content: "Validate payment",
            },
            {
                extra_trigger: ".pos-sale-ticket",
                trigger: '.button.next.highlight:contains("Next Order")',
                content: "Check proceeded validation",
            },
        ];
    }

    var steps = [];
    steps = steps.concat(pos_opening());
    steps = steps.concat(set_customer("Agrolait"));
    steps = steps.concat(add_product_to_order("Miscellaneous"));
    steps = steps.concat(payment("Postponed"));

    tour.register("pos_invoice_postponed_tour", {test: true, url: "/web"}, steps);
});
