odoo.define('pos_orders_history_reprint', function (require) {
    "use strict";
    var screens = require('pos_orders_history');

    var models = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var QWeb = core.qweb;


    screens.OrdersHistoryScreenWidget.include({
        show: function(){
            this._super();
        },
    });

    return screens;
});
