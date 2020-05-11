/*  Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
    License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_mail.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    function open_pos_neworder() {
        return [
            {
                trigger: "ul.o_menu_apps li.dropdown a.full",
                content: _t("Show Apps Menu"),
                position: "bottom",
            },
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
            {
                content: "waiting for loading to finish",
                trigger: ".order-button.neworder-button",
            },
        ];
    }

    function make_send_order() {
        var stps = [
            {
                content: "buy first product in list",
                trigger: ".product-list .product:first",
            },
            {
                content: "click to pay",
                trigger: ".actionpad .pay",
            },
        ];

        if (odoo._modules.indexOf("pos_cashier_select") !== -1) {
            stps = stps.concat([
                {
                    trigger: '.modal-dialog.cashier .selection-item:contains("Admin")',
                    content: "select first cashier",
                },
            ]);
        }

        stps = stps.concat([
            {
                content: "click to choose customer",
                trigger: ".js_set_customer",
            },
            {
                content: "choose first custome that has email",
                trigger: ".client-list-contents .client-line:first",
            },
            {
                content: "Set Customer",
                trigger: '.button:contains("Set Customer")',
            },
            {
                content: "Set Paying Method",
                trigger: '.paymentmethod:contains("Cash"):first',
            },
            {
                content: "Input cash",
                trigger: '.numpad .mode-button:contains("+50")',
            },
            {
                content: "Validate order",
                trigger: '.button:contains("Validate")',
            },
            {
                content: "Send mail",
                trigger: ".mail_receipt",
            },
            {
                content: "Check send-button",
                trigger: ".mail_receipt.disable",
            },
        ]);

        return stps;
    }

    var steps = [];
    steps = steps.concat(open_pos_neworder());
    steps = steps.concat(make_send_order());
    tour.register("pos_mail_tour", {test: true, url: "/web"}, steps);
});
