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
            var self = this;
            this.bus.add_channel_callback("pos_debt_notebook_sync", this.on_debt_updates, this);
            // poll connection handlers
            this.ready.then(function () {
                var longpolling_connection = self.bus.longpolling_connection
                // reload_debts request passed, but longpoll status is offline
                self.on('updateDebtHistory', function(partner_ids){
                    if (!longpolling_connection.status){
                        longpolling_connection.send_ping();
                    }
                }, self);
                // reload_debts request haven't passed, but longpoll status is online
                self.on('updateDebtHistoryFail', function(){
                    if (longpolling_connection.status){
                        longpolling_connection.send_ping();
                    }
                }, self);
                // poll_connection is changed, and longpoll status is online now
                longpolling_connection.on('change:poll_connection', function(status){
                    if (status){
                        self.after_restoring_connection();
                    }
                }, self);
            });
        },
        on_debt_updates: function(message){
            this.reload_debts(message.updated_partners);
        },
        after_restoring_connection(){
            var partners_in_orders = [];
            _.each(this.get_order_list(), function(o){
                if (o.get_client()){
                    partners_in_orders.push(o.get_client().id);
                }
            });
            var client_list_screen = this.gui.screen_instances.clientlist;
            var partner = false;
            if (client_list_screen && client_list_screen.clientlist_screen_is_opened()){
                partner = client_list_screen.new_client || client_list_screen.pos.get_client();
                partners_in_orders.push(partner.id);
            }
            if (partners_in_orders.length){
                this.reload_debts(partners_in_orders, 0, {"shadow": false});
            }
        },
    });
});
