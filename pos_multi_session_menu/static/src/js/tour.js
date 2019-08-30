odoo.define('pos_multi_session_menu.tour', function(require) {
    "use strict";

    var core = require('web.core');
    var tour = require('web_tour.tour');

    var _t = core._t;

    var steps = [{
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
        position: 'bottom',
    }, {
        trigger: ".o_pos_kanban button.oe_kanban_action_button",
        content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
        position: "bottom"
    }, {
        trigger: '.o_main_content:has(.loader:hidden)',
        content: 'Wait for loading is finished',
        timeout: 20000,
        run: function () {
            // it's a check
        }
    }, {
        content: "Switch to table or make dummy action",
        trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
        position: "bottom"
    }, {
        trigger: '.product-list .product-name:contains("Boni Oranges")',
        content: "Add the product",
        position: "top"
    },
   ];

   tour.register('pos_multi_session_menu_tour', {
        url: "/web",
        test: true,
   }, steps);

});
