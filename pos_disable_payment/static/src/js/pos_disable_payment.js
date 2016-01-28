odoo.define('pos_disable_payment', function(require){
"use strict";

    var chrome = require('point_of_sale.chrome')
    var screens = require('point_of_sale.screens')
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');    
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var _t = core._t;

    models.load_models({
        model:  'res.users',
        fields: ['allow_payments','allow_delete_order','allow_discount','allow_edit_price','allow_decrease_amount','allow_delete_order_line'],
        loaded: function(self,users){
            for (var i = 0; i < users.length; i++) {
                var user = _.find(self.users, function(el){ return el.id == users[i].id; });
                if (user) {
                    _.extend(user,users[i]);
                }
            }
        }
    });
    // Example of event binding and handling (triggering). Look up binding lower bind('change:cashier' ...
    // Example extending of class (method set_cashier), than was created using extend.
    // /odoo9/addons/point_of_sale/static/src/js/models.js
    // exports.PosModel = Backbone.Model.extend ...
    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        set_cashier: function(){
            PosModelSuper.prototype.set_cashier.apply(this, arguments);
            this.trigger('change:cashier',this);
        }
    });

    chrome.Chrome.include({
        init: function(){
            this._super.apply(this, arguments);
            this.pos.bind('change:selectedOrder', this.check_allow_delete_order, this)
            this.pos.bind('change:cashier', this.check_allow_delete_order, this)
        },
        check_allow_delete_order: function(){
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order()
            if (order) {
                 // User option calls "Allow remove non-empty order". So we got to check if its empty we can delete it.
                if (!user.allow_delete_order && order.orderlines.length > 0) {
                    this.$('.deleteorder-button').hide();
                } else {
                    this.$('.deleteorder-button').show();
                }
            }
        },
        loading_hide: function(){
            this._super();
            //extra checks on init
            this.check_allow_delete_order();
        }
    })
    chrome.OrderSelectorWidget.include({
        renderElement: function(){
            this._super();
            this.chrome.check_allow_delete_order();
        }
    })

    screens.OrderWidget.include({
        bind_order_events: function(){
            this._super();
            var order = this.pos.get('selectedOrder');
            order.orderlines.bind('add remove', this.chrome.check_allow_delete_order, this.chrome)
        }
    })

    // Here regular binding (in init) do not work for some reasons. We got to put binding method in renderElement.
    screens.ProductScreenWidget.include({
        init: function () {
            var self = this;
            this._super.apply(this, arguments);
        },
        start: function () {
            this._super();
            var user = this.pos.cashier || this.pos.user;
            if (!user.allow_payments) {
                this.actionpad.$('.pay').hide()
            }
        },
        renderElement: function () {
            this._super();
            this.pos.bind('change:cashier', this.checkPayAllowed, this)
        },
        checkPayAllowed: function () {
            var user = this.pos.cashier || this.pos.user;
            if (!user.allow_payments) {
                this.actionpad.$('.pay').hide()
            }else{
                this.actionpad.$('.pay').show()
            }
        }
    })
    screens.NumpadWidget.include({
        init: function () {
            this._super.apply(this, arguments);
            this.pos.bind('change:cashier', this.check_access, this)
        },
        renderElement: function(){
            this._super();
            this.check_access()
        },
        check_access: function(){
            var user = this.pos.cashier || this.pos.user;
            if (!user.allow_discount) {
                this.$el.find("[data-mode='discount']").css('visibility', 'hidden')
            }else{
                this.$el.find("[data-mode='discount']").css('visibility', 'visible')
            }
            if (!user.allow_edit_price) {
                this.$el.find("[data-mode='price']").css('visibility', 'hidden')
            }else{
                this.$el.find("[data-mode='price']").css('visibility', 'visible')
            }
        }
    })


    screens.NumpadWidget.include({
        clickDeleteLastChar: function(){
            var user = this.pos.cashier || this.pos.user;
            if(!user.allow_decrease_amount && this.state.get('mode') === 'quantity'){
                return;
            }
            if (!user.allow_delete_order_line && this.state.get('buffer') === "" && this.state.get('mode') === 'quantity'){
                return;
            }
            return this._super()
        }
    })
})
