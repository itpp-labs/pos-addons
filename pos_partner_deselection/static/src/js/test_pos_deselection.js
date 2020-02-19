/*  Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License MIT (https://opensource.org/licenses/MIT).*/
odoo.define("pos_partner_deselection.tour", function(require) {
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

    function set_customer_and_check_deselection(nam) {
        return set_customer(name).concat([
            {
                trigger: ".order-button.selected",
                content: _t("Dummy Ation"),
            },
            {
                extra_trigger: '.button.set-customer:contains("Customer")',
                trigger: '.button.set-customer:contains("Customer")',
                content: "Check that customer is deselected",
            },
        ]);
    }

    var steps = [];
    steps = steps.concat(pos_opening());
    steps = steps.concat(set_customer_and_check_deselection("Agrolait"));

    tour.register("pos_partner_deselection_tour", {test: true, url: "/web"}, steps);
});
