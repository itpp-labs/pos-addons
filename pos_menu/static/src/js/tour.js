odoo.define("pos_menu.tour", function(require) {
    "use strict";

    var core = require("web.core");
    var tour = require("web_tour.tour");

    var _t = core._t;

    function pos_opening(pos) {
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
                trigger: ".o_kanban_record:contains(" + pos + ") .btn-primary:first",
                content: _t(
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"
                ),
                position: "bottom",
            },
            {
                trigger: ".o_main_content:has(.loader:hidden)",
                content: "Wait for loading is finished",
                timeout: 20000,
                run: function() {
                    // It's a check
                },
            },
        ];
    }

    function check_menu(menu) {
        return [
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
                position: "bottom",
            },
            {
                content: "Add product #1",
                trigger: ".product-name:contains(" + menu[0] + ")",
                position: "bottom",
            },
            {
                content: "Add product #2",
                trigger: ".product-name:contains(" + menu[1] + ")",
                position: "bottom",
            },
            {
                content: "Add product #3",
                trigger: ".product-name:contains(" + menu[2] + ")",
                position: "bottom",
            },
            {
                content: "Add product #4",
                trigger: ".product-name:contains(" + menu[3] + ")",
                position: "bottom",
            },
        ];
    }

    var steps = [];
    var menu = ["Boni Oranges", "Black Grapes", "Carrots", "Conference pears"];
    var pos = "Shop1";
    steps = steps.concat(pos_opening(pos));
    steps = steps.concat(check_menu(menu));

    tour.register("pos_menu_tour", {url: "/web", test: true}, steps);
});
