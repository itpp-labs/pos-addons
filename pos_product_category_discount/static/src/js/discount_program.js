odoo.define('pos_product_category_discount.discount_program', function (require) {
    "use strict";

    var PopupWidget = require('point_of_sale.popups');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var Model = require('web.Model');
    var Widget = require('web.Widget');
    var core = require('web.core');
    var PosDiscountWidget = require('pos_discount.pos_discount');
    var PosBaseWidget = require('point_of_sale.BaseWidget');

    var QWeb = core.qweb;
    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        get_discount_category: function(id) {
            var self = this;
            var model = new Model('pos.category_discount');
            var domain = [['discount_program_id', '=', id]];
            model.call('search_read', [domain]).then(function (resultat) {
                resultat.forEach(function(item){
                    self.apply_discount_category(item.category_discount_pc, item.discount_category_id[0], item.discount_program_id[1]);
                });
            });
        },
        apply_discount_category: function(discount, category_id, discount_program_name) {
            var self = this;
            var order = this.get_order();
            var lines = order.get_orderlines().filter(function (item) { return item.product.pos_categ_id[0] == category_id && item.product.discount_allowed; });
            lines.forEach(function (item){
                item.discount = discount;
                item.discountStr = discount;
                item.discount_program_name = discount_program_name;
                order.get_orderline(item.id).set_discount(discount);
            });
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
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
        export_as_JSON: function(){
            var json = OrderSuper.prototype.export_as_JSON.call(this);
            json.product_discount = this.product_discount || false;
            return json;
        },
        init_from_JSON: function(json) {
            OrderSuper.prototype.init_from_JSON.apply(this,arguments);
            this.product_discount = json.product_discount || false;
        },
    });

    screens.OrderWidget.include({
        set_value: function(val) {
            var self = this;
            var order = this.pos.get_order();
            if (order.get_selected_orderline()) {
                var mode = this.numpad_state.get('mode');
                if( mode === 'discount') {
                    order.get_selected_orderline().discount_program_name = false;
                }
            }
            this._super(val);
        },
        update_summary: function(){
            this._super();
            var order = this.pos.get_order();
            var discount     = order ? order.get_total_discount() : 0;
            if (this.el.querySelector('.summary .total .discount .value')) {
                if (order.product_discount) {
                    discount = discount - order.product_discount;
                }
                this.el.querySelector('.summary .total .discount .value').textContent = this.format_currency(discount);
            }
        },
        remove_orderline: function(order_line){
            this._super(order_line);
            if (order_line.product.id == this.pos.config.discount_product_id[0]) {
                var order = this.pos.get_order();
                order.product_discount = false;
            }
        },
    });

    PosBaseWidget.include({
        init:function(parent,options){
            var self = this;
            this._super(parent,options);
            if (this.gui && this.gui.screen_instances.products && this.gui.screen_instances.products.action_buttons.discount) {
                var disc_widget = this.gui.screen_instances.products.action_buttons.discount;
                disc_widget.apply_discount = function(pc) {
                    var order    = self.pos.get_order();
                    var lines    = order.get_orderlines();
                    var product  = self.pos.db.get_product_by_id(self.pos.config.discount_product_id[0]);
                    if (pc === 0) {
                        order.product_discount = 0;
                    }
                    if (pc !== null) {
                        lines.forEach(function (item){
                            if (item.get_product() === product) {
                                order.remove_orderline(item);
                            }
                        });


                        // Product with a prohibited discount
                        var not_discount_product = order.get_orderlines().filter(function (item) {return item.product.discount_allowed === false;});

                        // Common price without discount for product with a prohibited discount
                        var price_without_discount = 0;

                        if (not_discount_product) {
                            not_discount_product.forEach(function(item){
                                var price = 0;
                                if (item.discount) {
                                    price = (item.price*(100.0 - item.discount)) / 100.0;
                                } else {
                                    price = item.price;
                                }
                                price_without_discount = price_without_discount + price;
                            });

                        }
                        // Discount
                        var discount = - pc / 100.0 * (order.get_total_with_tax() - price_without_discount);
                        order.product_discount = discount;
                        if( discount < 0 ) {
                            order.add_product(product, { price: discount });
                        }
                    }
                };
                disc_widget.button_click = function () {
                    self.gui.show_popup('number', {
                        'title': 'Discount Percentage',
                        'value': self.pos.config.discount_pc,
                        'disc_program': self.pos.discount_program.slice(0,4),
                        'confirm': function (val) {
                            if (val) {
                                val = Math.round(Math.max(0, Math.min(100, val)));
                            } else val = null;
                            self.gui.screen_instances.products.action_buttons.discount.apply_discount(val);
                        },
                    });
                };
            }
            if (this.gui && this.gui.popup_instances.number) {
                var num_widget = this.gui.popup_instances.number;
                this.gui.popup_instances.number.click_confirm = function () {
                    self.gui.close_popup();
                    if( num_widget.options.confirm ){
                        if (num_widget.input_disc_program) {
                            self.pos.get_discount_category(num_widget.discount_program_id);
                        }
                        num_widget.options.confirm.call(num_widget,num_widget.inputbuffer);
                    }
                };
                this.gui.popup_instances.number.click_numpad = function(event){
                    var newbuf = self.gui.numpad_input(
                        num_widget.inputbuffer,
                        $(event.target).data('action'),
                        {'firstinput': num_widget.firstinput});

                    num_widget.firstinput = (newbuf.length === 0);

                    if (newbuf !== num_widget.inputbuffer) {
                        num_widget.inputbuffer = newbuf;
                        num_widget.$('.value').text(this.inputbuffer);
                    }
                    num_widget.input_disc_program = false;
                };
            }
        },
    });

    models.load_models({
        model: 'pos.discount_program',
        fields: ['discount_program_name', 'discount_program_number', 'id'],
        domain: function(self){ return [['discount_program_active','=',true]]; },
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
        model:  'product.template',
        fields: ['discount_allowed','product_variant_id'],
        loaded: function(self,products){
            products.forEach(function(item){
                if (item.product_variant_id) {
                    var product  = self.db.get_product_by_id(item.product_variant_id[0]);
                    if (product) {
                        product.discount_allowed = item.discount_allowed;
                    }
                }
            });
        }
    });

    PopupWidget.include({
        show: function (options) {
            var self = this;
            this._super(options);
            this.popup_discount = false;
            if (options.disc_program) {
                self.popup_discount = true;
                self.events["click .discount-program-list .button"] = "click_discount_program";
            }
        },
        renderElement: function(){
            this._super();
            if (this.popup_discount) {
                this.$('.popup.popup-number').addClass("popup-discount");
            }
        },
        get_discount_program_by_id: function(id) {
            var disc_program_by_id = this.options.disc_program.filter(function (item) {
                return item.id === Number(id);
            });
            return disc_program_by_id[0];
        },
        click_discount_program: function(e) {
            var self = this;
            var id = e.currentTarget.id;
            if (id == 'other') {
                self.gui.show_screen('discountlist');
            } else {
                this.current_disc_program = this.get_discount_program_by_id(id);
                this.discount_program_name = this.current_disc_program.discount_program_name;
                this.$('.value').text(this.discount_program_name);
                this.input_disc_program = true;
                this.inputbuffer = '';
                this.discount_program_id = this.current_disc_program.id;
            }
        },
    });

    var DiscountProgramScreenWidget = screens.ScreenWidget.extend({
        template: 'DiscountProgramScreenWidget',
        init: function(parent, options){
            this._super(parent, options);
            this.discount_cache = new screens.DomCache();
        },
        auto_back: true,
        show: function(){
            var self = this;
            this._super();

            this.show_disc_button = false;

            this.renderElement();

            this.$('.back').click(function(){
                self.gui.back();
            });

            this.$('.next').click(function(){
                self.save_changes();
                self.gui.back();
            });

            var discount = this.pos.discount_program;
            this.render_list(discount);

            this.$('.discount-list-contents').delegate('.discount-line','click',function(event){
                self.line_select(event,$(this),parseInt($(this).data('id')));
            });
        },
        hide: function () {
            this._super();
        },
        // Render discount list
        render_list: function(discounts){
            var contents = this.$el[0].querySelector('.discount-list-contents');
            contents.innerHTML = "";
            for(var i = 0, len = Math.min(discounts.length,1000); i < len; i++){
                var discount    = discounts[i];
                var discountline = this.discount_cache.get_node(discount.id);
                if(!discountline){
                    var discountline_html = QWeb.render('DiscountLine',{widget: this, discount:discounts[i]});
                    discountline = document.createElement('tbody');
                    discountline.innerHTML = discountline_html;
                    discountline = discountline.childNodes[1];
                    this.discount_cache.cache_node(discount.id,discountline);
                }
                discountline.classList.remove('highlight');
                contents.appendChild(discountline);
            }
        },
        save_changes: function(){
            this.pos.get_discount_category(this.old_id);
        },
        toggle_save_button: function(){
            var $button = this.$('.button.next');
            if (!this.show_disc_button) {
                $button.addClass('oe_hidden');
                return;
            } else {
                $button.removeClass('oe_hidden');
                $button.text(_t('Apply'));
            }
        },
        line_select: function(event,$line,id){
            if (this.old_id !== id) {
                this.show_disc_button = true;
                this.old_id = id;
            }
            if ( $line.hasClass('highlight') ){
                $line.removeClass('highlight');
                this.show_disc_button = false;
            }else{
                this.$('.discount-list .highlight').removeClass('highlight');
                $line.addClass('highlight');
                var y = event.pageY - $line.parent().offset().top;
                this.show_disc_button = true;
            }

            this.toggle_save_button();
        },
        close: function(){
            this._super();
        },
    });
    gui.define_screen({name:'discountlist', widget: DiscountProgramScreenWidget});
});
