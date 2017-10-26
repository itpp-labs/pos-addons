odoo.define('pos_product_category_discount.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var Model = require('web.Model');

    models.load_models({
        model:  'product.template',
        fields: ['discount_allowed','product_variant_id'],
        loaded: function(self,products){
            products.forEach(function(item){
                if (item.product_variant_id) {
                    var product = self.db.get_product_by_id(item.product_variant_id[0]);
                    if (product) {
                        product.discount_allowed = item.discount_allowed;
                    }
                }
            });
        }
    });
    models.load_models({
        model: 'pos.discount_program',
        fields: [],
        domain: function(self){
            return [['discount_program_active','=',true]];
        },
        loaded: function(self,discount_program){
            var sorting_discount_program = function(idOne, idTwo){
                return idOne.discount_program_number - idTwo.discount_program_number;
            };
            if (discount_program) {
                self.discount_program = discount_program.sort(sorting_discount_program);
            }
        },
    });
    models.load_models({
        model: 'pos.category_discount',
        fields: [],
        loaded: function(self,category_discount){
            if (category_discount) {
                self.discount_categories = category_discount;
            }
        },
    });
    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var partner_model = _.find(this.models, function(model){
                return model.model === 'res.partner';
            });
            partner_model.fields.push('discount_program_id');
            return PosModelSuper.prototype.initialize.apply(this, arguments);
        },
        get_discount_categories: function(id) {
            return _.find(this.discount_categories, function(item){
                return item.discount_program_id === id;
            });
        },
        set_discount_categories_by_program_id: function(id) {
            if (this.config.iface_discount) {
                var self = this;
                var discount_categories = this.get_discount_categories(id);
                var order = this.get_order();
                if (discount_categories) {
                    order.remove_all_discounts();
                    discount_categories.forEach(function(discount) {
                        self.apply_discount_category(discount);
                    });
                }
            }
        },
        apply_discount_category: function(discount) {
            var self = this;
            var order = this.get_order();
            var lines = order.get_orderlines().filter(function(item) {
                return item.product.pos_categ_id[0] === discount.discount_category_id[0] && item.product.discount_allowed;
            });
            lines.forEach(function (line){
                item.discount_program_name = discount.discount_program_id[1];
                line.set_discount(discount.category_discount_pc);
            });
            order.current_discount_program = discount.discount_category_id;
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            OrderlineSuper.prototype.initialize.apply(this,arguments);
            if (this.order && this.order.current_discount_program) {
                this.apply_product_discount(this.order.current_discount_program[0]);
            }
        },
        apply_product_discount: function(id) {
            var self = this;
            var model = new Model('pos.category_discount');
            var domain = [['discount_program_id', '=', id]];
            model.call('search_read', [domain]).then(function (result) {
                result.forEach(function(res) {
                    if (res.discount_category_id[0] === self.product.pos_categ_id[0]) {
                        self.discount_program_name = res.discount_program_id[1];
                        self.set_discount(res.category_discount_pc);
                    }
                });
            });
        },
        export_as_JSON: function(){
            var json = OrderlineSuper.prototype.export_as_JSON.call(this);
            json.discount_program_name = this.discount_program_name || false;
            return json;
        },
        init_from_JSON: function(json) {
            OrderlineSuper.prototype.init_from_JSON.apply(this,arguments);
            this.discount_program_name = json.discount_program_name || false;
        },
        get_discount_name: function(){
            return this.discount_program_name;
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        remove_all_discounts: function() {
            if (this.pos.config.iface_discount) {
                this.current_discount_program = false;
                this.get_orderlines().forEach(function(line){
                    line.set_discount(false);
                });
            }
        },
        export_as_JSON: function(){
            var json = OrderSuper.prototype.export_as_JSON.call(this);
            json.product_discount = this.product_discount || false;
            json.current_discount_program = this.current_discount_program;
            return json;
        },
        init_from_JSON: function(json) {
            OrderSuper.prototype.init_from_JSON.apply(this,arguments);
            this.product_discount = json.product_discount || false;
            this.current_discount_program = json.current_discount_program;
        },
    });
});
