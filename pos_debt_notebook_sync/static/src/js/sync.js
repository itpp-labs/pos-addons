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
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            var channel_name = "pos.order_test";
            var callback = this.ms_on_update;
            self.add_channel(channel_name, callback);
        },
        ms_on_update: function(message){
            console.log("Adopted messages from another POS");
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        initialize: function(attributes, options){
            var self = this;
            options = options || {};
            OrderSuper.prototype.initialize.apply(this, arguments);
            this.bind('change:sync', function(){
                self.do_ms_update();
            });
        },
        add_product: function(){
            OrderSuper.prototype.add_product.apply(this, arguments);
            this.trigger('change:sync');
        },
        do_ms_update: function(){
            var self = this;
            var data = this.export_as_JSON();
            session.rpc("/pos_order_test/update", {message: data}).then(function(res) {
                console.log("Message sent");
            });
        }
    });
});
