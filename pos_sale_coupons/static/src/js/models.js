//  Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
//  Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
//  License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
odoo.define('pos_sale_coupons.models', function (require) {
    'use_strict';

    var models = require('point_of_sale.models');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var _t = core._t;

    models.load_models({
        model: 'sale.coupon.program',
        fields: [],
        domain: [['active', '=', true], ['program_type', '=', 'coupon_program']],
        condition: function(self) {
            return self.config.allow_sell_coupon || self.config.allow_consume_coupon;
        },
        loaded: function (self, programs) {
            self.db.add_sale_coupon_programs(programs);
        }
    });

    models.load_models({
        model: 'sale.coupon',
        fields: ['code', 'expiration_date', 'state', 'partner_id', 'pos_order_id', 'pos_discount_line_product_id', 'sold_via_order_id', 'program_id'],
        domain: [['state', 'in', ['new', 'reserved']]],
        condition: function(self) {
            return self.config.allow_sell_coupon || self.config.allow_consume_coupon;
        },
        loaded: function (self, coupons) {
            self.db.add_sale_coupons(coupons);
        }
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            _super_posmodel.initialize.apply(this, arguments);
            var self = this;
            this.ready.then(function () {
                self.bus.add_channel_callback('pos_sale_coupons', self.on_coupons_notification, self);
            });
        },
        on_coupons_notification: function(message) {
            var self = this;
            var coupon_programs = message.coupon_program_data;
            if (coupon_programs) {
                _.each(coupon_programs, function(coupon_program) {
                    var exist_sale_coupon_program = self.db.get_sale_coupon_program_by_id(coupon_program.id);
                    if (exist_sale_coupon_program) {
                        self.db.update_sale_coupon_programs([coupon_program]);
                    } else {
                        self.db.add_sale_coupon_programs([coupon_program]);
                    }
                });
            }
            var coupons = message.coupon_data;
            if (coupons) {
                _.each(coupons, function(coupon) {
                    var exist_sale_coupon = self.db.get_sale_coupon_by_id(coupon.id);
                    if (exist_sale_coupon) {
                        self.db.update_sale_coupons([coupon]);
                    } else {
                        self.db.add_sale_coupons([coupon]);
                    }
                });
            }
        },
        delete_current_order: function() {
            var self = this;
            var order = this.get_order();
            if (order) {
                var coupons_lines = order.get_orderlines().filter(function(line) {
                    return line.coupon && line.coupon.id;
                });
                _.each(coupons_lines, function(line) {
                    self.db.remove_old_coupon_id(line.coupon.id);
                })
            }
            _super_posmodel.delete_current_order.apply(this, arguments);
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        add_product: function(product, options) {
            var orderlines = this.get_orderlines();
            var coupon_orderline = orderlines.find(function(line) {
                return line.coupon && product.coupon && line.coupon.id === product.coupon.id;
            });
            if (coupon_orderline) {
                return false;
            }
            _super_order.add_product.apply(this, arguments);
        },
        apply_sale_coupon: function(coupon) {
            var program = this.pos.db.get_sale_coupon_program_by_id(coupon.program_id[0]);
            if (program.reward_type === 'discount') {
                this.apply_discount_program(coupon, program);
            } else if (program.reward_type === 'product') {
                this.apply_product_reward_program(coupon, program);
            }
        },
        apply_discount_program: function(coupon, program) {
            var discount_product = this.pos.db.product_by_id[program.discount_line_product_id[0]];

            if (!discount_product) {
                return this.pos.gui.show_popup('error', {
                    'title': _t('No coupon product found'),
                    'body': _t('The coupon product seems misconfigured. Make sure it is flagged as Can be Sold and Available in Point of Sale.')
                });
            }
            discount_product.coupon = {
                'id': coupon.id,
                'state': 'consumed',
            };
            var discount_price = 0;
            // discount_type: 'fixed_amount', 'percentage'
            if (program.discount_type === 'fixed_amount') {
                discount_price = program.discount_fixed_amount;
            } else if (program.discount_apply_on === 'on_order') {
                // calc price of the coupon at the order price
                discount_price = this.get_amount_discount_price(program.discount_percentage);
                if (program.discount_max_amount) {
                    discount_price = Math.min(discount_price, program.discount_max_amount);
                }
            } else if (program.discount_apply_on === 'cheapest_product') {
                // calc price of the coupon by cheapest product price
                var cheapest_product_orderline = this.get_cheapest_product_orderline();
                discount_price = cheapest_product_orderline.get_display_price() * (program.discount_percentage / 100);
                if (program.discount_max_amount) {
                    discount_price = Math.min(discount_price, program.discount_max_amount);
                }
            } else if (program.discount_apply_on === 'specific_product') {
                var specific_product = this.pos.db.product_by_id[program.discount_specific_product_id[0]];
                if (specific_product) {
                    // calc price of the coupon by specific product price
                    var specific_product_orderline = this.get_orderline_by_product(specific_product);
                    if (specific_product_orderline) {
                        discount_price = specific_product_orderline.get_display_price() * (program.discount_percentage / 100);
                        if (program.discount_max_amount) {
                            discount_price = Math.min(discount_price, program.discount_max_amount);
                        }
                    } else {
                        return false;
                    }
                } else {
                    return this.pos.gui.show_popup('error', {
                        'title': _t('Error: Unable to apply the coupon'),
                        'body': _t('The coupon product is used which is not available in the POS.')
                    });
                }
            }
            this.add_product(discount_product, {price: -discount_price});
            this.pos.db.update_old_coupon_ids(coupon.id);
        },
        apply_product_reward_program: function(coupon, program) {
            var reward_product = this.pos.db.product_by_id[program.reward_product_id[0]];
            if (reward_product) {
                reward_product.coupon = {
                    'id': coupon.id,
                    'state': 'consumed'
                };
                // add free product
                this.add_product(reward_product, {quantity: program.reward_product_quantity, price: 0});
                this.pos.db.update_old_coupon_ids(coupon.id);
            } else {
                this.pos.gui.show_popup('error', {
                    'title': _t('Error: Unable to apply the coupon'),
                    'body': _t('The coupon product is used which is not available in the POS.')
                });
            }
        },
        get_amount_discount_price: function(discount_percentage) {
            return this.get_total_with_tax() * (discount_percentage / 100);
        },
        get_cheapest_product_orderline: function() {
            var self = this;
            var orderlines = this.get_orderlines();
            var sorted_orderlines = orderlines.sort(function (x, y) {
                return x.product.get_price(self.pricelist, x.get_quantity()) -
                    y.product.get_price(self.pricelist, y.get_quantity());
            });
            return sorted_orderlines[0];
        },
        get_orderline_by_product: function(product) {
            return this.get_orderlines().find(function(line) {
               return line.product.id === product.id;
            });
        },
        remove_orderline: function( line ) {
            this.assert_editable();
            if (line.coupon) {
                this.pos.db.remove_old_coupon_id(line.coupon.id);
            }
            _super_order.remove_orderline.apply(this, arguments);
        },
        add_orderline: function(line){
            _super_order.add_orderline.apply(this, arguments);
            if (line.coupon && line.coupon.id) {
                this.pos.db.update_old_coupon_ids(line.coupon.id);
            }
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            _super_orderline.initialize.apply(this, arguments);
            if (options.product && options.product.coupon && options.product.coupon.id) {
                this.coupon = {
                    id: options.product.coupon.id,
                    state: options.product.coupon.state,
                    coupon_value: options.product.coupon.coupon_value
                };
                // update old coupon ids after reload page
                this.pos.db.update_old_coupon_ids(this.coupon.id);
            }
        },
        can_be_merged_with: function(orderline) {
            if (this.coupon && orderline.coupon && this.coupon.id !== orderline.coupon.id) {
                return false;
            }
            return _super_orderline.can_be_merged_with.apply(this, arguments);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            if (this.coupon) {
                data.coupon_id = this.coupon.id;
                data.coupon_state = this.coupon.state;
                data.coupon_value = this.coupon.coupon_value;
            }
            return data;
        },
        init_from_JSON: function(json) {
            if (json.coupon_id) {
                this.coupon = {
                    id: json.coupon_id,
                    state: json.coupon_state
                };
            }
            _super_orderline.init_from_JSON.call(this, json);
        },
        //  Read more about this function in pos_multi_session module
        apply_ms_data: function(data) {
            if (_super_orderline.apply_ms_data) {
                _super_orderline.apply_ms_data.apply(this, arguments);
            }
            this.coupon = data.coupon || false;
            this.trigger('change', this);
        }
    });

    return models;
});
