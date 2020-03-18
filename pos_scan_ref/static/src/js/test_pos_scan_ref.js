odoo.define("pos_scan_ref.tour", function(require) {
    "use strict";

    var refcode = "1234567890333";
    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    var steps = [
        {
            trigger:
                '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Ready to launch your point of sale? Click here."),
            position: "bottom",
        },
        {
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content: _t(
                "Click to start the point of sale interface. It runs on tablets, laptops, or industrial hardware. Once the session launched, the system continues to run without an internet connection.</p>"
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
            trigger: '.orderline.selected:contains("Boni Oranges")',
            position: "bottom",
        },
    ];

    tour.register("tour_pos_scan_ref", {test: true, url: "/web?debug=assets#"}, steps);
});
