odoo.define('pos_logout.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');

    var steps = [{
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
    }, {
        trigger: ".o_pos_kanban button.oe_kanban_action_button",
        content: "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
    }];

    steps = steps.concat([{
        trigger: '.o_main_content:has(.loader:hidden)',
        content: 'waiting for loading to finish',
        timeout: 20000,
        run: function () {
            // it's a check
        },
    }, {
        content: "Switch to table or make dummy action",
        trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
    }, {
        trigger: '.pos-branding .username',
        content: 'Open Cashier popup',
    }, {
        trigger: '.popup .exit',
        content: 'Block POS Screen',
    }, {
        trigger: '.popups .block',
        content: 'Click for unblock the screen',
    }, {
        trigger: '.modal-dialog:visible .selection-item:contains("Administrator")',
        content: 'Change current cashier',
    }]);

    steps = steps.concat([{
        trigger: ".header-button",
        content: "close the Point of Sale frontend",
    }, {
        trigger: ".header-button.confirm",
        content: "confirm closing the frontend",
    }, {
        content: "wait until backend is opened",
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        run: function () {
            // no need to click on trigger
        },
    }]);

    tour.register('pos_logout_tour', {test: true, url: '/web' }, steps);
});
