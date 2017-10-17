odoo.define('pos_order_note.tour', function(require) {
    "use strict";

    var core = require('web.core');
    var tour = require('web_tour.tour');

    var _t = core._t;

    tour.register('pos_order_note_tour', {
        url: "/web",
    }, [{
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        position: 'bottom',
    }, {
        trigger: ".o_pos_kanban button.oe_kanban_action_button",
        position: "bottom"
    }, {
        trigger: ".tables .table",
        position: "bottom"
    }, {
        trigger: ".product-list .product",
        position: "bottom"
    },
    {
        trigger: ".control-button:has(.fa-tag)",
        position: "bottom"
    }, {
        trigger: ".product_note #1",
        position: "bottom"
    }, {
        trigger: ".product_note #2",
        position: "bottom"
    }, {
        trigger: ".popup-confirm-note .confirm",
        position: "bottom"
    }, {
        trigger: ".control-button:has(.fa-tag)",
        position: "bottom"
    }, {
        trigger: ".popup-confirm-note .order_type",
        position: "bottom"
    }, {
        trigger: ".product_note #3",
        position: "bottom"
    }, {
        trigger: ".popup-confirm-note .confirm",
        position: "bottom"
    }, {
        trigger: ".control-buttons .order-submit",
        position: "bottom"
    }
    ]);
});
