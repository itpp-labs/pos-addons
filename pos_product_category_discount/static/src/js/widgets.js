odoo.define('pos_product_category_discount.widgets', function (require) {
    "use strict";

    var PopupWidget = require('point_of_sale.popups');
    var models = require('pos_product_category_discount.models');
    var screens = require('pos_discount_base.screens');
    var gui = require('point_of_sale.gui');
    var Model = require('web.Model');
    var Widget = require('web.Widget');
    var core = require('web.core');
    var PosDiscountWidget = require('pos_discount.pos_discount');
    var PosBaseWidget = require('point_of_sale.BaseWidget');

    var QWeb = core.qweb;
    var _t = core._t;

    screens.OrderWidget.include({
        apply_discount: function(pc) {
            var order = this.pos.get_order();
            order.discount_percent = pc;
            if (order.input_disc_program) {
                this.apply_discount_category(order.discount_program_id);
            }
            if (pc === 0) {
                order.product_discount = 0;
            }
            if (pc !== null) {
                // Product with a prohibited discount
                var not_discount_product = order.get_orderlines().filter(function(item) {
                    return item.product.discount_allowed === false;
                });

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
                        price_without_discount += price;
                    });
                }
                // Discount
                var discount = - pc / 100.0 * (order.get_total_with_tax() - price_without_discount);
                order.product_discount = discount;
                this._super(pc);
                order.trigger('change', order);
            }
        },
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
            var discount = order
                           ? order.get_total_discount()
                           : 0;
            if (this.el.querySelector('.summary .total .discount .value')) {
                if (order && order.product_discount) {
                    discount -= order.product_discount;
                }
                this.el.querySelector('.summary .total .discount .value').textContent = this.format_currency(discount);
            }
        },
        remove_orderline: function(order_line){
            this._super(order_line);
            if (order_line.product.id === this.pos.config.discount_product_id[0]) {
                var order = this.pos.get_order();
                order.product_discount = false;
            }
        },
        orderline_change: function(line){
            if (line.product.id === this.pos.config.discount_product_id[0]) {
                var order = this.pos.get_order();
                order.product_discount = line.price;
            }
            this._super(line);
        },
        discount_button_click: function() {
            var self = this;
            if (this.pos.discount_program && this.pos.discount_program.length) {
                this.discount_options.disc_program = this.pos.discount_program.slice(0,4);
            }
            this._super();
        },
        confirm_discount: function(val) {
            if (val) {
                val = Math.round(Math.max(0, Math.min(100, val)));
            } else {
                val = null;
            }
            this._super(val);
        },
        apply_discount_category: function(discount_program_id) {
            this.pos.set_discount_categories_by_program_id(discount_program_id);
        },
    });

    PosBaseWidget.include({
        init:function(parent,options){
            var self = this;
            this._super(parent,options);
            if (this.gui && this.gui.popup_instances.number) {
                var num_widget = this.gui.popup_instances.number;
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
                    if (this.pos.get_order()) {
                        this.pos.get_order().input_disc_program = false;
                    }
                };
            }
        },
    });

    PopupWidget.include({
        show: function (options) {
            var self = this;
            this._super(options);
            this.popup_discount = false;
            if (options && options.disc_program) {
                this.popup_discount = true;
                this.events = _.extend(this.events || {}, {
                    'click .discount-program-list .button': 'click_discount_program',
                    'click .reset': function() {
                        var order = self.pos.get_order();
                        if (order.discount_program_id) {
                            order.remove_all_discounts();
                            self.gui.close_popup();
                        } else {
                            self.$('.value').text(0);
                            self.inputbuffer = 0;
                        }
                    },
                });
            }
        },
        renderElement: function(){
            this._super();
            if (this.popup_discount) {
                this.$('.popup.popup-number').addClass("popup-discount");
                var order = this.pos.get_order();
                if (order && order.discount_percent) {
                    this.$('.value').text(order.discount_percent);
                    this.inputbuffer = String(order.discount_percent);
                }
            }
        },
        get_discount_program_by_id: function(id) {
            return _.find(this.options.disc_program, function (item) {
                return item.id === Number(id);
            });
        },
        click_discount_program: function(e) {
            var self = this;
            var id = e.currentTarget.id;
            if (id === 'other') {
                self.gui.show_screen('discountlist');
            } else {
                this.current_disc_program = this.get_discount_program_by_id(id);
                this.discount_program_name = this.current_disc_program.discount_program_name;
                this.$('.value').text(this.discount_program_name);
                var order = this.pos.get_order();
                order.input_disc_program = true;
                this.inputbuffer = '';
                order.discount_program_id = this.current_disc_program.id;
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
                var discount = discounts[i];
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
            this.pos.set_discount_categories_by_program_id(this.old_id);
        },
        toggle_save_button: function(){
            var $button = this.$('.button.next');
            if (this.show_disc_button) {
                $button.removeClass('oe_hidden');
                $button.text(_t('Apply'));
            } else {
                $button.addClass('oe_hidden');
                return;
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

    gui.Gui.prototype.screen_classes.filter(function(el) {
        return el.name === 'clientlist';
    })[0].widget.include({
        save_changes: function(){
            var order = this.pos.get_order();
            if (this.new_client) {
                if ((this.has_client_changed() || this.has_discount_program_changed()) &&
                    this.new_client.discount_program_id) {
                    this.pos.set_discount_categories_by_program_id(this.new_client.discount_program_id[0]);
                }
                if (!this.new_client.discount_program_id) {
                    this.pos.get_order().remove_all_discounts();
                }
            } else {
                this.pos.get_order().remove_all_discounts();
            }
            this._super();
        },
        has_discount_program_changed: function(){
            if (this.old_client && this.new_client && this.old_client.id === this.new_client.id) {
                if (this.old_client.discount_program_id && this.new_client.discount_program_id && (
                    this.old_client.discount_program_id[0] === this.new_client.discount_program_id[0]
                )) {
                    return false;
                }
                return true;
            }
        },
        toggle_save_button: function() {
            var $button = this.$('.button.next');
            if (!this.editing_client && this.has_discount_program_changed()) {
                 $button.text(_t('Apply Change'));
                 $button.toggleClass('oe_hidden',!this.has_discount_program_changed());
            } else {
                this._super();
            }
        },
        saved_client_details: function(partner_id){
            this.partner_cache.clear_node(partner_id);
            this._super(partner_id);
        },
    });

    screens.ProductListWidget.include({
        render_product: function(product){
            var res = this._super(product);
            if (product.available_in_pos){
                $(res).addClass('oe_hidden');
            } else {
                $(res).removeClass('oe_hidden');
            }
            return res;
        },
    });
});
