odoo.define('pos_debt_sync', function(require){
    var exports = {};

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var longpolling = require('pos_longpolling');

    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.bus.add_channel_callback("pos_debt_notebook_sync", this.on_debt_updates, this);
        },
        on_debt_updates: function(message){
            this.reload_debts(message.updated_partners);
        },
        _on_load_debts: function(debts){
            var longpolling_connection = this.bus.longpolling_connection;
            if (longpolling_connection && !longpolling_connection.status){
                longpolling_connection.send_ping();
            }
            PosModelSuper.prototype._on_load_debts.apply(this, arguments);
        },
        _failed_load_debts: function(load_partner_ids){
            var longpolling_connection = this.bus.longpolling_connection;
            if (longpolling_connection && longpolling_connection.status){
                longpolling_connection.send_ping();
            }
            PosModelSuper.prototype._failed_load_debts.apply(this, arguments);
        },
    });
});
