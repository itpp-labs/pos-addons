/*  Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73>
    License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_scan_ref.tour', function (require) {
    "use strict";

    var refcode = '1234567890333';
    var tour = require("web_tour.tour");
    var core = require('web.core');
    var _t = core._t;


        var steps = [{
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
            position: 'bottom',
        }, {
            trigger: '.oe_menu_text:contains("Products")',
            content: 'Go to Products',
            position: 'bottom',
        }, {
            trigger: '.oe_kanban_global_click.o_kanban_record:first',
            content: 'Choose the product',
            position: 'bottom',
        }, {
            trigger: '.btn.btn-primary.btn-sm.o_form_button_edit',
            content: 'Click Edit button',
            position: 'bottom',
        }, {
            trigger: 'input.o_field_char.o_field_widget.o_input:eq(1)',
            content: 'Enter reference code',
            position: 'bottom',
            run: function() {
                $('input.o_field_char.o_field_widget.o_input:eq(1)').val(refcode).trigger('input');
            },
        }, {
            trigger: '.btn.btn-primary.btn-sm.o_form_button_save',
            content: 'Save result',
            position: 'bottom',
            timeout: 10000,
        }, {
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Back to <b>point of sale</b>."),
            position: 'bottom',
        }, {
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
            position: "bottom"
        }, {
            content: "Switch to table or make dummy action",
            trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
            position: "bottom"
        }, {
            content: 'waiting for loading to finish',
            trigger: '.order-button.neworder-button',
        }];

    tour.register('tour_pos_scan_ref', { test: true, url: '/web?debug=assets#' }, steps);

});
