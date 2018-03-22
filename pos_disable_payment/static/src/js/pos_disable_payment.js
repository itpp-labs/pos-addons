odoo.define('pos_disable_payment', function(require){

"use strict";

    var chrome = require('point_of_sale.chrome');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var _t = core._t;

    models.load_fields("res.users", ['allow_payments','allow_delete_order','allow_discount','allow_edit_price','allow_decrease_amount','allow_decrease_kitchen_only','allow_delete_order_line','allow_create_order_line','allow_refund','allow_manual_customer_selecting']);

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
            this.pos.bind('change:selectedOrder', this.check_allow_delete_order, this);
            this.pos.bind('change:cashier', this.check_allow_delete_order, this);
        },
        check_allow_delete_order: function(){
            var user = this.pos.get_cashier() || this.pos.user;
            var order = this.pos.get_order();
            if (order) {
                 // User option calls "Allow remove non-empty order". So we got to check if its empty we can delete it.
                if (!user.allow_delete_order && order.orderlines.length > 0) {
                    this.$('.deleteorder-button').addClass('disable');
                } else {
                    this.$('.deleteorder-button').removeClass('disable');
                }
            }
        },
        loading_hide: function(){
            this._super();
            //extra checks on init
            this.check_allow_delete_order();
        }
    });
    chrome.OrderSelectorWidget.include({
        renderElement: function(){
            this._super();
            this.chrome.check_allow_delete_order();
        }
    });

    screens.OrderWidget.include({
        bind_order_events: function(){
            this._super();
            var order = this.pos.get('selectedOrder');
            order.orderlines.bind('add remove', this.chrome.check_allow_delete_order, this.chrome);
        },
        orderline_change: function(line) {
            this._super(line);
            var user = this.pos.get_cashier() || this.pos.user;
            if (line && line.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    $('.numpad-backspace').removeClass('disable');
                } else{
                    $('.numpad-backspace').addClass('disable');
                }
            } else {
                $('.numpad-backspace').removeClass('disable');
            }
            this.check_kitchen_access(line);
        },
        click_line: function(orderline, event) {
            this._super(orderline, event);
            this.check_kitchen_access(orderline);
        },
        check_kitchen_access: function(line){
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_decrease_amount || user.allow_decrease_kitchen_only) {
                return true;
            }
            var state = this.getParent().numpad.state;
            if (line.mp_dirty === false) {
                $('.numpad').find("[data-mode='quantity']").addClass('disable');
                if (user.allow_discount) {
                    state.changeMode('discount');
                } else if (user.allow_edit_price) {
                    state.changeMode('price');
                } else {
                    state.changeMode("");
                }
            } else {
                $('.numpad').find("[data-mode='quantity']").removeClass('disable');
                if (state.get('mode') !== 'quantity') {
                    state.changeMode('quantity');
                }
            }
        }
    });

    // Here regular binding (in init) do not work for some reasons. We got to put binding method in renderElement.
    screens.ProductScreenWidget.include({
        start: function () {
            this._super();
            this.checkPayAllowed();
            this.checkCreateOrderLine();
            this.checkDiscountButton();
        },
        renderElement: function () {
            this._super();
            this.pos.bind('change:cashier', this.checkPayAllowed, this);
            this.pos.bind('change:cashier', this.checkCreateOrderLine, this);
            this.pos.bind('change:cashier', this.checkDiscountButton, this);
        },
        checkCreateOrderLine: function () {
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_create_order_line) {
                $('.numpad').show();
                $('.rightpane').show();
            }else{
                $('.numpad').hide();
                $('.rightpane').hide();
            }
        },
        checkPayAllowed: function () {
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_payments) {
                this.actionpad.$('.pay').removeClass('disable');
            }else{
                this.actionpad.$('.pay').addClass('disable');
            }
        },
        checkDiscountButton: function() {
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_discount) {
                this.$('.control-buttons .js_discount').removeClass('disable');
            }else{
                this.$('.control-buttons .js_discount').addClass('disable');
            }
        }
    });
    screens.ScreenWidget.include({
        renderElement: function () {
            this._super();
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_payments) {
                $('.pay').removeClass('disable');
            }else{
                $('.pay').addClass('disable');
            }
            if (user.allow_create_order_line) {
                $('.numpad').show();
                $('.rightpane').show();
            }else{
                $('.numpad').hide();
                $('.rightpane').hide();
            }
        }
    });
    screens.ActionpadWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);
            this.pos.bind('change:cashier', this.checkManualCustomerSelecting, this);
        },
        checkManualCustomerSelecting: function() {
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_manual_customer_selecting) {
                this.$('.set-customer').removeClass('disable');
            } else {
                this.$('.set-customer').addClass('disable');
            }
        },
        renderElement: function () {
            this._super();
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_payments) {
                $('.pay').removeClass('disable');
            } else{
                $('.pay').addClass('disable');
            }
            this.checkManualCustomerSelecting();
        }
    });
    screens.PaymentScreenWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);
            this.pos.bind('change:cashier', this.checkManualCustomerSelecting, this);
        },
        checkManualCustomerSelecting: function() {
            var user = this.pos.get_cashier() || this.pos.user;
            if (user.allow_manual_customer_selecting) {
                this.$('.js_set_customer').removeClass('disable');
            } else {
                this.$('.js_set_customer').addClass('disable');
            }
        },
        renderElement: function(){
            this._super();
            this.checkManualCustomerSelecting();
        }
    });
    screens.NumpadWidget.include({
        init: function () {
            this._super.apply(this, arguments);
            this.pos.bind('change:cashier', this.check_access, this);
        },
        renderElement: function(){
            this._super();
            this.check_access();
        },
        check_access: function(){
            var user = this.pos.get_cashier() || this.pos.user;
            var order = this.pos.get_order();
            var orderline = false;
            if (order) {
                orderline = order.get_selected_orderline();
            }
            if (user.allow_discount) {
                this.$el.find("[data-mode='discount']").removeClass('disable');
            }else{
                this.$el.find("[data-mode='discount']").addClass('disable');
            }
            if (user.allow_edit_price) {
                this.$el.find("[data-mode='price']").removeClass('disable');
            }else{
                this.$el.find("[data-mode='price']").addClass('disable');
            }
            if (user.allow_refund) {
                this.$el.find('.numpad-minus').removeClass('disable');
            }else{
                this.$el.find('.numpad-minus').addClass('disable');
            }
            if (orderline && orderline.quantity <= 0) {
                if (user.allow_delete_order_liner) {
                    this.$el.find('.numpad-backspace').removeClass('disable');
                }else{
                    this.$el.find('.numpad-backspace').addClass('disable');
                }
            }
        }
    });

    screens.NumpadWidget.include({
        clickDeleteLastChar: function(){
            var user = this.pos.get_cashier() || this.pos.user;
            if(!user.allow_decrease_amount && this.state.get('mode') === 'quantity'){
                return;
            }
            if (!user.allow_delete_order_line && this.state.get('buffer') === "" && this.state.get('mode') === 'quantity'){
                return;
            }
            return this._super();
        }
    });
});
