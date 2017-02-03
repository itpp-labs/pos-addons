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
            this.add_channel("pos_debt_notebook_sync", this.on_debt_updates, this);
        },
        on_debt_updates: function(message){
            this.reload_debts(message.updated_partners);
        }
    });
});
