/* Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_debt_notebook_custom.must_have_product', function(require){
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var Model = require('web.DataModel');

    models.load_fields('product.product',['is_must_have_product']);
    models.load_fields('res.partner',['has_must_have_product_order_id']);
    models.load_fields('account.journal',['must_have_product_id']);

    var MustHaveProductButton = screens.ActionButtonWidget.extend({
        template: 'MustHaveProductButton',
        button_click: function () {
            var pos = this.pos;
            var mhp = pos.must_have_product[0]
            pos.get_order().add_product(pos.db.get_product_by_id(mhp.product_id.id));
        },
    });

    screens.define_action_button({
        'name': 'must_have_product',
        'widget': MustHaveProductButton,
        'condition': function(){
            return true;
        },
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.ready.then(function(res){
                self.update_must_have_product();
                self.update_must_have_product_button();
            });
            this.bind('update_must_have_button', function(res){
                self.update_must_have_product_button();
            });
        },

        update_must_have_product: function(){
            var self = this;
            cashregisters_ids = _.filter(this.cashregisters, function(cr){
                return cr.journal.must_have_product_id;
            });
            this.must_have_product = [];
            var journal_id = false;
            var product_id = false;
            _.each(cashregisters_ids, function(cr){
                journal_id = cr.journal_id;
                product_id = self.db.get_product_by_id(cr.journal.must_have_product_id[0]);
                if (product_id) {
                    self.must_have_product.push({
                        journal_id: journal_id,
                        product_id: product_id,
                    });
                }
            });
        },

        update_must_have_product_button: function(){
            var self = this;
            if (this.check_mast_have_product_button()){
                this.gui.screen_instances.products.action_buttons.must_have_product.$el.show()
            } else if (this.gui.screen_instances.products) {
                this.gui.screen_instances.products.action_buttons.must_have_product.$el.hide()
            }
        },

        check_mast_have_product_button: function(){
            var self = this;
            var partner = this.get_client();
            var order = this.get_order();
            if (!order || !partner || !partner.debts || !this.must_have_product.length) {
                return false;
            }
            var orderlines = order.get_orderlines();
            var possible_products = _.map(this.must_have_product, function(pm){
                return pm.product_id.id;
            });
            var mhp_in_order = _.find(orderlines, function(ol){
                return _.contains(possible_products, ol.product.id)
                    && ol.quantity > 0
                    && ol.price >= ol.product.list_price;
            });
            var mhp_product = this.db.get_product_by_id(this.must_have_product[0].product_id.id);
            if (mhp_in_order || partner.has_must_have_product_order_id ||
            (mhp_product && partner.debts[self.must_have_product[0].journal_id[0]].balance < 2 * mhp_product.list_price)) {
                return false;
            }
            return true;
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        set_client: function(client){
            OrderSuper.prototype.set_client.apply(this,arguments);
            this.pos.trigger('update_must_have_button');
        },

        select_orderline: function(){
            OrderSuper.prototype.select_orderline.apply(this, arguments);
            this.pos.trigger('update_must_have_button');
        },
    });

    var OrderLineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            var self = this;
            OrderLineSuper.prototype.initialize.apply(this,arguments);
            this.bind('change', function(data){
                self.pos.update_must_have_product_button();
            });
        },
    });

    screens.ProductScreenWidget.include({
        show: function(reset){
            this._super(reset);
            this.pos.trigger('update_must_have_button');
        },
    });
});
