/*  Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73>
    License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_scan_ref.tour', function (require) {
    "use strict";

    var refcode = '1234567890333';
    var tour = require("web_tour.tour");
    var core = require('web.core');
    var _t = core._t;


        var steps = [tour.STEPS.MENU_MORE, {
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
            position: 'bottom',
        }, {
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
            position: "bottom",
        }, {
            content: 'waiting for loading to finish',
            trigger: '.breadcrumb-button',
            timeout: 60000,
        }, {
            content: 'Scan product by reference code',
            trigger: '.pos-branding',
            run: function () {
                posmodel.barcode_reader.scan(refcode);
            },
            timeout: 60000,
        }, {
            content: 'Check that the product was scanned successfully',
            trigger: '.orderline.selected:contains("Boni Oranges")',
            position: "bottom",
            timeout: 30000,
        }];

    tour.register('tour_pos_scan_ref', { test: true, url: '/web' }, steps);

});
