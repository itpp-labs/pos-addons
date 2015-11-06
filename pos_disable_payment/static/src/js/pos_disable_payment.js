odoo.define('pos_disable_payment', function(require){
"use strict";

    var chrome = require('point_of_sale.chrome')
    var screens = require('point_of_sale.screens')
    var core = require('web.core');
    var _t = core._t;

    chrome.Chrome.include({
        init: function(){
            this._super.apply(this, arguments);
            this.pos.bind('change:selectedOrder', this.check_allow_delete_order, this)
        },
        check_allow_delete_order: function(){
            if (!this.pos.config.allow_delete_order){
                var order = this.pos.get_order()
                if (order){
                    this.$('.deleteorder-button').toggle(order.is_empty());
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

    screens.ProductScreenWidget.include({
        start: function(){
            this._super();
           if (!this.pos.config.allow_payments){
               this.actionpad.$('.pay').hide()
           }
        }
    })

    screens.NumpadWidget.include({
        renderElement: function(){
            this._super();
            if (!this.pos.config.allow_discount){
                this.$el.find("[data-mode='discount']").css('visibility', 'hidden')
            }
            if (!this.pos.config.allow_edit_price){
                this.$el.find("[data-mode='price']").css('visibility', 'hidden')
            }
        }
    })

    screens.NumpadWidget.include({
        clickDeleteLastChar: function(){
            if (!this.pos.config.allow_delete_order_line && this.state.get('buffer') === "" && this.state.get('mode') === 'quantity'){
                return;
            }
            return this._super();
        }
    })
})