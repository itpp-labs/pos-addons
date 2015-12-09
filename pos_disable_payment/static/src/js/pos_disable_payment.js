odoo.define('pos_disable_payment', function (require) {
    "use strict";

    var core = require('web.core');
    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var PosBaseWidget = require('point_of_sale.BaseWidget');

    models.load_models({
        model:  'res.users',
        fields: ['allow_payments','allow_delete_order','allow_discount','allow_edit_price','allow_delete_order_line'],
        loaded: function(self,users){
            for (var i = 0; i < users.length; i++) {
                var user = _.find(self.users, function(el){ return el.id == users[i].id; });
                if (user) {
                    _.extend(user,users[i]);
                }
            }
        },
    });

    // Пример добавления обаботчика события. Само событие чуть ниже bind('change:cashier' ...
    // Пример расширения класса (раширяем метод set_cashier), который создается через extend.
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
        init: function () {
            this._super.apply(this, arguments);
            this.pos.bind('change:selectedOrder', this.check_allow_delete_order, this);
            this.pos.bind('change:cashier', this.check_allow_delete_order, this);
        },
        check_allow_delete_order: function () {
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order()
            if (order) {
                if (!user.allow_delete_order) {
                    this.$('.deleteorder-button').hide();
                } else {
                    this.$('.deleteorder-button').show();
                }
            }
        },
        loading_hide: function () {
            this._super();
            //extra checks on init
            this.check_allow_delete_order();
        }
    })

    chrome.OrderSelectorWidget.include({
        renderElement: function () {
            this._super();
            this.chrome.check_allow_delete_order();
        }
    })

    screens.OrderWidget.include({
        bind_order_events: function () {
            this._super();
            var order = this.pos.get('selectedOrder');
            order.orderlines.bind('add remove', this.chrome.check_allow_delete_order, this.chrome)
        }
    })

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
            this.pos.bind('change:cashier', this.renderElement, this)
        },
        renderElement: function () {
            this._super();
            var user = this.pos.cashier || this.pos.user;
            if (!user.allow_discount) {
                this.$el.find("[data-mode='discount']").css('visibility', 'hidden')
            }
            if (!user.allow_edit_price) {
                this.$el.find("[data-mode='price']").css('visibility', 'hidden')
            }
        }
    })

    screens.NumpadWidget.include({
        clickDeleteLastChar: function () {
            var user = this.pos.cashier || this.pos.user;
            if (!user.allow_delete_order_line && this.state.get('buffer') === "" && this.state.get('mode') === 'quantity') {
                return;
            }
            return this._super();
        }
    })

})