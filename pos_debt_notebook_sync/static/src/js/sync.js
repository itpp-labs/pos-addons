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
                var longpolling_connection = (self.sync_bus || self.bus).longpolling_connection;
                // reload_debts request passed, but longpoll is offline
                self.on('updateDebtHistory', function(partner_ids){
                    if (!longpolling_connection.is_online){
                        longpolling_connection.send_ping();
                    }
                }, self);
                // reload_debts request haven't passed, but longpoll is online
                self.on('updateDebtHistoryFail', function(){
                    if (longpolling_connection.is_online){
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
        _on_load_debts: function(debts){
            var self = this;
            var unsent_orders = _.filter(this.db.get_orders(), function(o){
                return o.data.updates_debt;
            });
            if (unsent_orders){
                // Since unsent orders are presented it means that connection was recently restored,
                // request for updating data of offline order partners will be sent right after offline orders is pushed.
                // To prevent incorrect debt rendering we delete the partner data come from the server before offline orders were sent

                var offline_order_partners = _.map(unsent_orders, function(o){
                    return o.data.partner_id;
                });
                debts = _.filter(debts, function(deb){
                    return !_.contains(offline_order_partners, deb.partner_id);
                });
            }
            PosModelSuper.prototype._on_load_debts.apply(this, [debts]);
        },
        after_restoring_connection: function(){
            var self = this;
            var partners_to_reload = [];
            _.each(this.get_order_list(), function(o){
                if (o.get_client()){
                    partners_to_reload.push(o.get_client().id);
                }
            });
            _.each(this.db.get_orders(), function(o){
                if (o.data.updates_debt && o.data.partner_id){
                    partners_to_reload.push(o.data.partner_id);
                }
            });
            var client_list_screen = this.gui.screen_instances.clientlist;
            var partner = false;
            if (client_list_screen && client_list_screen.clientlist_screen_is_opened()){
                partner = client_list_screen.new_client || client_list_screen.pos.get_client();
                if (partner) {
                    partners_to_reload.push(partner.id);
                }
            }

            this.push_order(null,{'show_error':true}).then(function(){
                if (partners_to_reload.length){
                    self.reload_debts(_.uniq(partners_to_reload), 0, {"shadow": false});
                }
            });
        },
    });
});
