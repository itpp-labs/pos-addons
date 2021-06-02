/* Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * Copyright 2019 Kildebekov Anvar <https://it-projects.info/team/kildebekov>
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_logout.tour", function (require) {
    "use strict";

    var tour = require("web_tour.tour");

    function pos_opening() {
        return [
            tour.STEPS.SHOW_APPS_MENU_ITEM,
            {
                trigger:
                    '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content:
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
                position: "right",
                edition: "community",
            },
            {
                trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content:
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
                position: "bottom",
                edition: "enterprise",
            },
            {
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content:
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
            },
            {
                trigger: ".pos:has(.loader:hidden)",
                content: "waiting for loading to finish",
                timeout: 20000,
                run: function () {
                    // It's a check
                },
            },
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
            },
        ];
    }

    function pos_closing() {
        return [
            {
                trigger: ".header-button",
                content: "close the Point of Sale frontend",
            },
            {
                trigger: ".header-button, .close_button, .confirm",
                content: "close the Point of Sale",
            },
            {
                content: "wait until backend is opened",
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                run: function () {
                    // No need to click on trigger
                },
            },
        ];
    }

    var steps = [];
    steps = steps.concat(pos_opening(), pos_closing());

    tour.register("pos_logout_tour", {test: true, url: "/web"}, steps);
});
