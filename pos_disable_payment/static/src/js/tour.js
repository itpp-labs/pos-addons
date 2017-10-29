odoo.define('pos_disable_payment.tour', function(require) {
    "use strict";

    var core = require('web.core');
    var tour = require('web_tour.tour');

    var _t = core._t;

    tour.register('pos_disable_payment_tour', {
        test: true,
        url: "/web",
    }, [{
        trigger: '.o_app[data-menu="4"], .oe_menu_toggler[data-menu="4"]',
        content: _t("Configuration options are available in the Settings app."),
        position: "bottom"
    }, {
        trigger: '.oe_menu_leaf[data-menu=65]',
        content: _t("Open the <b>Users</b> menu"),
        position: "right"
    }, {
        trigger: '.o_list_view > tbody > tr',
        content: _t("Click on the item"),
        position: "bottom"
    }, {
        trigger: ".o_form_button_edit",
        content: _t("Click to edit user"),
        position: "bottom"
    }, {
        trigger: 'a[href="#notebook_page_12"]',
        content: _t("Move on <b>Point of Sale</b> tab"),
        position: "top"
    }, {
        trigger: 'label:contains("Allow refunds")',
        extra_trigger: 'input[name="allow_refund"]:propChecked({disabled: true})',
        content: _t("Uncheck the box <b>Allow refunds</b>"),
        position: "right"
    }, {
        trigger: ".o_form_button_save",
        content: _t("Save the changes"),
        position: "bottom"
    }, {
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
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
        trigger: '.product-list .product',
        content: _t("Add the first product"),
        position: "top"
    }, {
        content: _t("Hidden"),
        trigger: '.pads .numpad-minus[style="visibility: hidden;"]',
        position: "bottom"
    }

]);

});
