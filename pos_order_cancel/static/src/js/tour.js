/* Copyright 2017 gaelTorrecillas <https://github.com/gaelTorrecillas>
 * Copyright 2017 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_order_cancel.tour', function(require) {
    "use strict";

    var core = require('web.core');
    var tour = require('web_tour.tour');


    tour.register('pos_order_cancel_tour', {
        test: true,
        url: "/web",
    }, [tour.STEPS.SHOW_APPS_MENU_ITEM, {
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
        position: 'right',
        edition: 'community'
    }, {
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
        position: 'bottom',
        edition: 'enterprise'
    }, {
        trigger: ".o_pos_kanban button.oe_kanban_action_button",
        content: "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
        position: "bottom"
    }, {
        trigger: ".product-list .product",
        content: "<p>Click product 1</p>",
        position: "bottom",
        timeout: 20000,
    }, {
        trigger: ".product-list .product:not(:first)",
        content: "<p>Click product 2</p>",
        position: "bottom"
    }, {
        trigger: ".pads .numpad-backspace",
        content: "<p>Remove orderline</p>",
        position: "bottom"
    }, {
        trigger: ".reason-button[data-id='1']",
        content: "<p>Click predefined reason</p>",
        position: "bottom"
    }, {
        trigger: ".reason-button[data-id='3']",
        content: "<p>Click predefined reason</p>",
        position: "bottom"
    }, {
        trigger: ".popup-confirm-cancellation .confirm",
        content: "<p>Click confirm button</p>",
        position: "bottom"
    },{
        trigger: ".deleteorder-button",
        content: "<p>Click remove order button</p>",
        position: "bottom"
    }, {
        trigger: ".reason-button[data-id='1']",
        content: "<p>Click predefined reason</p>",
        position: "bottom"
    }, {
        trigger: ".popup-confirm-cancellation .confirm",
        content: "<p>Click confirm button</p>",
        position: "bottom"
    }
    ]);
});
