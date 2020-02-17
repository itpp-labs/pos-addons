/* - Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    License MIT (https://opensource.org/licenses/MIT). */
/* This file is not used until we make a CI tool, that can run it. Normal CI cannot use longpolling.
   See https://github.com/odoo/odoo/commit/673f4aa4a77161dc58e0e1bf97e8f713b1e88491
 */
odoo.define("pos_wechat.tour", function(require) {
    "use strict";

    var DUMMY_AUTH_CODE = "134579302432164181";
    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    function open_pos_neworder() {
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
            },
            {
                content: "waiting for loading to finish",
                trigger: ".order-button.neworder-button",
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

    var steps = [];
    steps = steps.concat(open_pos_neworder());
    steps = steps.concat(add_product_to_order("Miscellaneous"));
    // Simulate qr scanning
    steps = steps.concat([
        {
            content: "Make dummy action and trigger scanning event",
            trigger: ".order-button.selected",
            run: function() {
                core.bus.trigger("qr_scanned", DUMMY_AUTH_CODE);
            },
        },
    ]);
    // Wait until order is proceeded
    steps = steps.concat([
        {
            content: "Screen is changed to payment screen",
            trigger: ".button_next",
            run: function() {
                // No need to click on the button
            },
        },
        {
            content:
                "Screen is changed to receipt or products screen (depends on settings)",
            trigger: ".button_print,.order-button",
        },
    ]);
    tour.register("tour_pos_debt_notebook", {test: true, url: "/web"}, steps);
});
