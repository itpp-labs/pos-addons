odoo.define('pos_fiscal_current', function (require) {

    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var Model = require('web.DataModel');
    var utils = require('web.utils');
    var formats = require('web.formats');
    var QWeb = core.qweb;
    var _t = core._t;

    screens.OrderWidget.include({
        update_summary: function () {
            this._super();
            var order = this.pos.get_order();
            if (order.fiscal_position != undefined) {
                this.el.querySelector('.summary .total .fiscal .value').textContent = order.fiscal_position.name;
            }
        }
    })

})