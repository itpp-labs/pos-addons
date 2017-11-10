odoo.define('pos_mobile.tour', function(require) {
"use strict";

var core = require('web.core');
var tour = require('web_tour.tour');

var _t = core._t;

tour.register('pos_mobile_tour', {
    test: true,
    url: "/web?m=1",
}, [{
    trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
    content: "Ready to launch your <b>point of sale in mobile version</b>? <i>Click here</i>.",
    position: 'bottom',
}, {
    trigger: ".o_pos_kanban button.oe_kanban_action_button",
    content: "<p>Click to start the point of sale in the mobile interface.</p>",
    position: "bottom"
}]);

});
