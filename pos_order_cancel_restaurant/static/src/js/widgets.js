odoo.define('pos_order_cancel_restaurant.widgets', function (require) {
    "use strict";

    var models = require('pos_order_cancel_restaurant.models');
    var screens = require('point_of_sale.screens');
    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var PopupWidget = require('point_of_sale.popups');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var PosOrderCancelWidget = require('pos_order_cancel.widgets');

    var Model = require('web.DataModel');
    var QWeb = core.qweb;
    var _t = core._t;


    chrome.OrderSelectorWidget.include({
        deleteorder_click_handler: function(event, $el) {
            var self = this;
            var order = this.pos.get_order();
            if (!order) {
                return;
            }
            if (this.pos.config.kitchen_canceled_only) {
                if (order.is_empty() && order.canceled_lines && order.canceled_lines.length) {
                    order.destroy_and_upload_as_canceled();
                } else if (!order.is_empty() && !order.get_order_lines_by_dirty_status(false).length){
                     this.gui.show_popup('confirm',{
                        'title': _t('Destroy Current Order ?'),
                        'body': _t('You will lose any data associated with the current order'),
                        confirm: function() {
                            order.destroy_and_upload_as_canceled();
                        },
                    });
                } else {
                    this._super(event, $el);
                }
            } else {
                this._super(event, $el);
            }
        },
    });

    screens.OrderWidget.include({
        show_popup: function(type){
            var self = this;
            var order = this.pos.get_order();
            var orderline = order.get_selected_orderline();
            if (this.pos.config.kitchen_canceled_only && orderline && !orderline.was_printed && type === 'product') {
                return false;
            }
            this._super(type);
        },
    });

    PosOrderCancelWidget.ReasonCancellationScreenWidget.include({
        save_changes: function(){
            this._super();
            var type = this.get_type();
            if (this.pos.config.auto_send_to_kitchen && type === 'product') {
                this.auto_sent_to_kitchen();
            }
        },
        auto_sent_to_kitchen: function() {
            var order = this.pos.get_order();
            if (order) {
                var current_line = order.get_selected_orderline();
                if (current_line.was_printed && order.hasChangesToPrint()) {
                    order.printChanges();
                    order.saveChanges();
                }
            }
        }
    });

    PosOrderCancelWidget.ConfirmCancellationPopupWidget.include({
        click_confirm: function(){
            this._super();
            if (this.pos.config.auto_send_to_kitchen && this.type === 'product') {
                this.auto_sent_to_kitchen();
            }
        },
        auto_sent_to_kitchen: function() {
            var order = this.pos.get_order();
            if (order) {
                var current_line = order.get_selected_orderline();
                if (current_line.was_printed && order.hasChangesToPrint()) {
                    order.printChanges();
                    order.saveChanges();
                }
            }
        }
    });
});
