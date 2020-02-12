odoo.define("pos_debranding.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");

    tour.register(
        "pos_debranding_tour",
        {
            url: "/web",
            test: true,
        },
        [
            {
                trigger:
                    '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content:
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
                position: "bottom",
            },
            {
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content:
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
                position: "bottom",
            },
            {
                trigger: ".o_main_content:has(.loader:hidden)",
                content: "waiting for loading to finish",
                timeout: 20000,
                run: function() {
                    // It's a check
                },
            },
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
                position: "bottom",
            },
            {
                trigger: ".pos-branding:not(:has(>.pos-logo))",
                content: "Check logo",
                run: function() {
                    // It's a check
                },
            },
        ]
    );
});
