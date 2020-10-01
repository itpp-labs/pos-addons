/*  Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73>
    Copyright 2020 Denis Mudarisov <https://github.com/trojikman>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_scan_ref.tour", function(require) {
    "use strict";

    var refcode = "1234567890333";
    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    var steps = [
        tour.STEPS.SHOW_APPS_MENU_ITEM,
        {
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t(
                "Ready to launch your <b>point of sale</b>? <i>Click here</i>."
            ),
            position: "right",
            edition: "community",
        },
        {
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t(
                "Ready to launch your <b>point of sale</b>? <i>Click here</i>."
            ),
            position: "bottom",
            edition: "enterprise",
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
        },
        {
            content: "waiting for loading to finish",
            trigger: ".order-button.neworder-button",
        },
        {
            content: "Scan product by reference code",
            trigger: ".pos-branding",
            run: function() {
                window.posmodel.barcode_reader.scan(refcode);
            },
        },
        {
            content: "Check that the product was scanned successfully",
            trigger: '.orderline.selected:contains("Cabinet with Doors")',
            position: "bottom",
        },
    ];

    tour.register("tour_pos_scan_ref", {test: true, url: "/web"}, steps);
});
