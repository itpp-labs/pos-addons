//  Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
//  License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
odoo.define('pos_sale_coupons.screens', function (require) {
    'use_strict';

    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var screens = require('point_of_sale.screens');
    var PopupWidget = require('point_of_sale.popups');
    var _t = core._t;

    var CouponInputPopupWidget = PopupWidget.extend({
        template: 'CouponInputPopupWidget',
        show: function(options){
            options = options || {};
            this._super(options);
            this.renderElement();
            var self = this;
            var $coupon_input = this.$('input:first');
            this.hide_coupon_value_specification();
            $coupon_input.focus();
            $coupon_input.on('change', function(ev){
                var coupon = self.get_coupon_by_code(this.value);
                if (coupon && self.check_coupon_is_code_storage_program(coupon)) {
                    self.show_coupon_value_specification();
                } else {
                    self.hide_coupon_value_specification();
                }
            });
        },

        click_confirm: function(){
            var value = this.$('input,textarea').val();
            this.gui.close_popup();
            if( this.options.confirm ){
                this.options.confirm.call(this,value);
            }
        },

        get_coupon_by_code: function(code) {
            return this.pos.db.get_sale_coupon_by_code(code);
        },

        check_coupon_is_code_storage_program: function(coupon_id) {
            if (!coupon_id) {
                return false;
            }
            return this.pos.db.get_sale_coupon_program_by_id(coupon_id.program_id[0]).is_code_storage_program;
        },

        show_coupon_value_specification: function() {
            _.each(this.$('.coupon_value_specification'), function(el){
                $(el).show();
            });
        },

        hide_coupon_value_specification: function() {
            _.each(this.$('.coupon_value_specification'), function(el){
                $(el).hide();
            });
            this.$('input.coupon_value_specification').val('');
        },

    });
    gui.define_popup({name:'coupon_textinput', widget: CouponInputPopupWidget});


    // Sell Coupon
    var SellCouponButton = screens.ActionButtonWidget.extend({
        template: 'SellCouponButton',
        button_click: function () {
            var self = this;
            this.gui.show_popup('coupon_textinput',{
                'title': _t('Sell Coupon'),
                'sale_coupon_popup': true,
                'confirm': function(code) {
                    var coupon = self.get_coupon_by_code(code);
                    if (coupon) {
                        if (coupon.state !== 'new') {
                            // Unable to use coupon
                            return this.gui.show_popup('error', {
                                'title': _t('Error: Unable to sell the coupon'),
                                'body': _t('This coupon is being used or expired.')
                            });
                        }
                        if (self.check_coupon_is_code_storage_program(coupon)) {
                            var val = this.$('input.coupon_value_specification').val();
                            self.sell_coupon(coupon, val);
                        }
                        self.sell_coupon(coupon);
                    } else {
                        return this.gui.show_popup('error', {
                            'title': _t('Error: Could not find the Coupon'),
                            'body': _t('There is no coupon with this barcode.')
                        });
                    }
                },
            });
            this.pos.barcode_reader.restore_callbacks();
        },
        sell_coupon: function(coupon, value) {
            if (coupon) {
                if (coupon.pos_discount_line_product_id.length) {
                    var product = this.pos.db.product_by_id[coupon.pos_discount_line_product_id[0]];
                    if (product) {
                        product.coupon = {
                            'id': coupon.id,
                            'state': 'sold',
                            'coupon_value': value
                        };
                        this.pos.get_order().add_product(product, (value && {'price': value}) || {});
                        product.coupon_id = false;
                    } else {
                        this.gui.show_popup('error', {
                            'title': _t('No coupon product found'),
                            'body': _t('The coupon product seems misconfigured. Make sure it is flagged as Can be Sold and Available in Point of Sale.')
                        });
                    }
                } else {
                    this.gui.show_popup('error', {
                        'title': _t('Error: Unable to sell the coupon'),
                        'body': _t('Unable to find an associated POS product for the coupon.')
                    });
                }
            }
        },
        get_coupon_by_code: function(code) {
            return this.pos.db.get_sale_coupon_by_code(code);
        },

        check_coupon_is_code_storage_program: function(coupon_id) {
            if (!coupon_id) {
                return false;
            }
            return this.pos.db.get_sale_coupon_program_by_id(coupon_id.program_id[0]).is_code_storage_program;
        },
    });

    screens.define_action_button({
        'name': 'sell_coupon_button',
        'widget': SellCouponButton,
        'condition': function () {
            return this.pos.config.allow_sell_coupon;
        },
    });

    // Consume Coupon
    var ConsumeCouponButton = screens.ActionButtonWidget.extend({
        template: 'ConsumeCouponButton',
        button_click: function () {
            var self = this;
            this.gui.show_popup('textinput', {
                'title': _t('Consume Coupon'),
                'sale_coupon_popup': true,
                'confirm': function(code) {
                    var coupon = self.get_coupon_by_code(code);
                    if (coupon) {
                        // apply the coupon to the order
                        self.pos.get_order().apply_sale_coupon(coupon);
                    }
                },
            });
            this.pos.barcode_reader.restore_callbacks();
        },
        get_coupon_by_code: function(code) {
            var coupon = this.pos.db.get_sale_coupon_by_code(code);
            if (coupon) {
                if (coupon.pos_order_id || this.pos.db.coupon_is_old(coupon)) {
                    // Unable to consume the coupon
                    return this.gui.show_popup('error', {
                        'title': _t('Error: Unable to consume the coupon'),
                        'body': _t('This coupon has been consumed.')
                    });
                }
                var program = this.pos.db.get_sale_coupon_program_by_id(coupon.program_id[0]);
                if (program.force_sale_before_consumption && (!coupon.sold_via_order_id || coupon.state !== 'reserved')) {
                    // Unable to consume the coupon
                    return this.gui.show_popup('error', {
                        'title': _t('Error: Unable to consume the coupon'),
                        'body': _t('This coupon has not been sold.')
                    });
                }
                return coupon;
            }
            // Not found coupon
            return this.gui.show_popup('error', {
                'title': _t('Error: Could not find the Coupon'),
                'body': _t('There is no coupon with this barcode.')
            });
        },
    });

    screens.define_action_button({
        'name': 'consume_coupon_button',
        'widget': ConsumeCouponButton,
        'condition': function () {
            return this.pos.config.allow_consume_coupon;
        },
    });

    screens.ScreenWidget.include({
        barcode_product_action: function(code) {
            var popup = this.pos.gui.current_popup;
            if (popup && popup.options.sale_coupon_popup) {
                popup.$('input,textarea').val(code.code);
                popup.click_confirm();
            } else {
                this._super(code);
            }
        },
    });

    return screens;
});
