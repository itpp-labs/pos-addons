odoo.define('pos_order_cancel.widgets', function (require) {
    "use strict";

    var models = require('pos_order_cancel.models');
    var screens = require('point_of_sale.screens');
    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var PopupWidget = require('point_of_sale.popups');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var Model = require('web.DataModel');
    var QWeb = core.qweb;
    var _t = core._t;

    gui.Gui.include({
        back: function() {
            if (this.pos.get_order()){
                this._super();
            }
        }
    });

    chrome.OrderSelectorWidget.include({
        deleteorder_click_handler: function(event, $el) {
            var self = this;
            var order = this.pos.get_order();
            if (order.is_empty()) {
                if (order.canceled_lines && order.canceled_lines.length) {
                    this.gui.screen_instances.products.order_widget.show_popup('order');
                } else {
                    this._super(event, $el);
                }
            } else {
                this.gui.screen_instances.products.order_widget.show_popup('order');
            }
        },
    });

    screens.OrderWidget.include({
        init: function(parent, options) {
            this._super(parent,options);
            this.pos.selected_cancelled_reason = '';
        },
        show_popup: function(type, line){
            var self = this;
            var order = this.pos.get_order();
            var orderline = line || order.get_selected_orderline();
            var title = 'Order ';
            if (type === "product") {
                if (!orderline) {
                    return false;
                }
                title = 'Product ';
            }
            // type of object which is removed (product or order)
            this.gui.show_popup('confirm-cancellation',{
                'title': _t(title + 'Cancellation Reason'),
                'reasons': self.pos.cancelled_reason,
                'value': self.pos.selected_cancelled_reason.name,
                'type': type,
                confirm: function(reason){
                    if (type === 'product') {
                        order.save_reason_cancelled_line(orderline, reason);
                    }
                    if (type === 'order') {
                        order.save_canceled_order(reason);
                    }
                }
            });
        },
        set_value: function(val) {
            // ask_cancel_reason -- show reason popup after change qty with numpad
            // This is essential when pos_multi_session is installed,
            // because otherwise every POS will be asked for reason
            var order = this.pos.get_order();
            if (order) {
                order.ask_cancel_reason = true;
            }
            this._super(val);
        },
    });

    var ConfirmCancellationPopupWidget = PopupWidget.extend({
        template: 'ConfirmCancellationPopupWidget',
        show: function(options){
            this._super(options);
            if (options.reasons) {
                this.events = _.extend(this.events, {
                    'click .cancelled-reason .reason-button': 'click_cancelled_reason',
                });
            }
            this.type = options.type;

            options.reasons.forEach(function(item) {
                item.active = false;
            });
            var other = {'other': true};
            this.options.reasons = this.options.reasons.slice(0, 9);
            this.buttons = this.options.reasons.slice();

            var split_to_array = function(arr, size) {
                var newArray = [];
                for (var i=0; i < arr.length; i += size) {
                    newArray.push(arr.slice(i, i + size));
                }
                return newArray;
            };
            if (this.options.reasons.length === 9) {
                this.options.reasons = this.options.reasons.slice(0, 8);
                this.buttons = this.options.reasons.slice();
                this.buttons.push(other);
            }
            this.buttons = split_to_array(this.buttons, 3);
            this.renderElement();
        },
        get_reason_by_id: function(id) {
            return this.options.reasons.find(function(item) {
                return item.id === Number(id);
            });
        },
        click_cancelled_reason: function(e) {
            var self = this;
            var id = e.currentTarget.id;
            if (id === 'other') {
                self.gui.show_screen('reason_screen', {type: this.type});
            } else {
                self.set_active_reason_status($(e.target), Number(id));
            }
        },
        set_active_reason_status: function(reason_obj, id){
            if (reason_obj.hasClass("active")) {
                reason_obj.removeClass("active");
                this.get_reason_by_id(id).active = false;
            } else {
                reason_obj.addClass("active");
                this.get_reason_by_id(id).active = true;
            }
        },
        click_confirm: function(){
            var active_reasons = this.options.reasons.filter(function(item) {
                return item.active === true;
            });
            var active_reasons_name = [];
            active_reasons.forEach(function(item) {
                active_reasons_name.push(item.name);
            });
            if(this.pos.config.allow_custom_reason || active_reasons_name.length>0){
                this.gui.close_popup();
                if( this.options.confirm ){
                    var reason = this.$('.popup-confirm-cancellation textarea').val();
                    if (reason) {
                        reason += "; ";
                    }
                    this.options.confirm.call(this, reason + active_reasons_name.join("; "));
                }
            }
        },
    });
    gui.define_popup({name:'confirm-cancellation', widget: ConfirmCancellationPopupWidget});

    var ReasonCancellationScreenWidget = screens.ScreenWidget.extend({
        template: 'ReasonCancellationScreenWidget',
        events: {
            'click .reason-line': function (event) {
                var line = $('.reason-line#'+parseInt(event.currentTarget.id));
                this.line_select(line, parseInt(event.currentTarget.id));
            },
            'click .reason-back': function () {
                this.gui.back();
            },
            'click .reason-next': function () {
                this.save_changes();
                this.gui.back();
            },
        },
        init: function(parent, options){
            this._super(parent, options);
            this.reason_cache = new screens.DomCache();
        },
        auto_back: true,
        show: function(){
            this._super();
            this.show_reason_button = false;
            this.render_list(this.pos.cancelled_reason);
        },
        render_list: function(reasons){
            var contents = this.$el[0].querySelector('.reason-list-contents');
            contents.innerHTML = "";
            for(var i = 0, len = Math.min(reasons.length,1000); i < len; i++){
                var reason = reasons[i];
                var cancellation_reason = this.reason_cache.get_node(reason.id);
                if(!cancellation_reason){
                    var cancellation_reason_html = QWeb.render('CancellationReason',{widget: this, reason:reasons[i]});
                    cancellation_reason = document.createElement('tbody');
                    cancellation_reason.innerHTML = cancellation_reason_html;
                    cancellation_reason = cancellation_reason.childNodes[1];
                    this.reason_cache.cache_node(reason.id,cancellation_reason);
                }
                if (reason.active) {
                    cancellation_reason.classList.add('highlight');
                    this.show_reason_button = true;
                } else {
                    cancellation_reason.classList.remove('highlight');
                }
                contents.appendChild(cancellation_reason);
            }
            this.toggle_save_button();
        },
        save_changes: function(){
            var self = this;
            var order = this.pos.get_order();
            var orderline = order.get_selected_orderline();

            var type = this.get_type();
            var active_reasons = this.pos.cancelled_reason.filter(function(item) {
                return item.active === true;
            });
            var active_reasons_name = [];
            active_reasons.forEach(function(item) {
                active_reasons_name.push(item.name);
            });
            var reason = active_reasons_name.join("; ");
            if (type === 'product') {
                order.save_reason_cancelled_line(orderline, reason);
            }
            if (type === 'order') {
                order.save_canceled_order(reason);
            }
        },
        toggle_save_button: function(){
            var $button = this.$('.button.next');
            if (this.show_reason_button) {
                $button.removeClass('oe_hidden');
                $button.text(_t('Apply'));
            } else {
                $button.addClass('oe_hidden');
                return;
            }
        },
        line_select: function(line,id){
            if (line.hasClass("highlight")) {
                line.removeClass("highlight");
                this.get_reason_by_id(id).active = false;
            } else {
                line.addClass("highlight");
                this.get_reason_by_id(id).active = true;
            }
            this.show_reason_button = false;
            var exist_active_reason = this.pos.cancelled_reason.find(function(item) {
                return item.active === true;
            });
            if (exist_active_reason) {
                this.show_reason_button = true;
            }
            this.toggle_save_button();
        },
        get_type: function(){
            return this.gui.get_current_screen_param('type');
        },
        get_reason_by_id: function(id) {
            return this.pos.cancelled_reason.find(function(item) {
                return item.id === Number(id);
            });
        },
    });
    gui.define_screen({name:'reason_screen', widget: ReasonCancellationScreenWidget});

    return {
        ConfirmCancellationPopupWidget: ConfirmCancellationPopupWidget,
        ReasonCancellationScreenWidget: ReasonCancellationScreenWidget,
    };
});
