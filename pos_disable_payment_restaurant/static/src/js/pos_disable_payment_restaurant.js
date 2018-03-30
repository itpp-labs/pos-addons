/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
* License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_disable_payment_restaurant', function(require){

    "use strict";

    var screens = require('pos_disable_payment');
    var models = require('point_of_sale.models');

    models.load_fields("res.users", ['allow_decrease_kitchen_only','allow_remove_kitchen_order_line']);

    screens.OrderWidget.include({
        check_numpad_access: function(line) {
            this._super(line);
            var order = this.pos.get_order();
            if (order) {
                line = line || order.get_selected_orderline();
                var user = this.pos.cashier || this.pos.user;
                if (!user.allow_decrease_amount || !user.allow_remove_kitchen_order_line) {
                    this.check_kitchen_access(line);
                }
            }
        },
        orderline_change: function(line) {
            this._super(line);
            var user = this.pos.cashier || this.pos.user;
            if (line && line.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    this.$el.find('.numpad-backspace').removeClass('disable');
                    if (user.allow_remove_kitchen_order_line) {
                        $('.pads .numpad').find('.numpad-backspace').removeClass('disable');
                    } else if (line.at_least_once_printed) {
                        $('.pads .numpad').find('.numpad-backspace').addClass('disable');
                    }
                } else{
                    this.$el.find('.numpad-backspace').addClass('disable');
                }
            }
        },
        orderline_change_line: function(line) {
            this._super(line);
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order();
            if (order && !user.allow_decrease_amount) {
                this.check_kitchen_access(line);
            }
        },
        check_kitchen_access: function(line) {
            var user = this.pos.cashier || this.pos.user;
            var state = this.getParent().numpad.state;
            if (user.allow_decrease_kitchen_only) {
                $('.numpad').find("[data-mode='quantity']").removeClass('disable');
                if (state.get('mode') !== 'quantity') {
                    state.changeMode('quantity');
                }
            } else if (line.mp_dirty) {
                if ($('.numpad').find("[data-mode='quantity']").hasClass('disable')) {
                    $('.numpad').find("[data-mode='quantity']").removeClass('disable');
                    state.changeMode('quantity');
                }
            } else {
                $('.numpad').find("[data-mode='quantity']").addClass('disable');
                if (state.get('mode') === 'quantity') {
                    if (user.allow_discount) {
                        state.changeMode('discount');
                    } else if (user.allow_edit_price) {
                        state.changeMode('price');
                    } else {
                        state.changeMode("");
                    }
                }
            }
            if (line && line.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    $('.pads .numpad').find('.numpad-backspace').removeClass('disable');
                    if (user.allow_remove_kitchen_order_line) {
                        $('.pads .numpad').find('.numpad-backspace').removeClass('disable');
                    } else if (line.at_least_once_printed) {
                        $('.pads .numpad').find('.numpad-backspace').addClass('disable');
                    }
                } else {
                    $('.pads .numpad').find('.numpad-backspace').addClass('disable');
                }
            }
        }
    });

    screens.NumpadWidget.include({
        check_access: function(){
            this._super();
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order();
            var orderline = order
            ? order.get_selected_orderline()
            : false;
            if (orderline && orderline.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    this.$el.find('.numpad-backspace').removeClass('disable');
                    if (user.allow_remove_kitchen_order_line) {
                        this.$el.find('.numpad-backspace').removeClass('disable');
                    } else if (orderline.at_least_once_printed) {
                        this.$el.find('.numpad-backspace').addClass('disable');
                    }
                } else{
                    this.$el.find('.numpad-backspace').addClass('disable');
                }
            }
        }
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        set_dirty: function(dirty) {
            if (this.mp_dirty !== dirty && dirty === false) {
                this.at_least_once_printed = true;
            }
            _super_orderline.set_dirty.apply(this,arguments);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.at_least_once_printed = this.at_least_once_printed || [];
            return data;
        },
        init_from_JSON: function(json) {
            this.at_least_once_printed = json.at_least_once_printed;
            _super_orderline.init_from_JSON.call(this, json);
        }
    });
});
