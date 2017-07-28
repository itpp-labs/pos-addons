odoo.define('pos_cancel_order.order_note', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var multiprint = require('pos_restaurant.multiprint');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var PopupWidget = require('point_of_sale.popups');
    var QWeb = core.qweb;
    var _t = core._t;

    models.load_models({
        model:  'product.template',
        fields: ['pos_notes','product_variant_id'],
        loaded: function(self,products){
            products.forEach(function(item){
                if (item.product_variant_id) {
                    var product  = self.db.get_product_by_id(item.product_variant_id[0]);
                    if (product) {
                        product.note = item.pos_notes;
                    }
                }
            });
        }
    });
    models.load_models({
        model: 'pos.product_notes',
        fields: ['name', 'number'],
        loaded: function(self,product_notes){
            var sorting_product_notes = function(idOne, idTwo){
                return idOne.number - idTwo.number;
            };
            if (product_notes) {
                self.product_notes = product_notes.sort(sorting_product_notes);
            }
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        set_note: function(note){
            this.old_note = {};
            this.old_note = this.note;
            this.note = note;
            this.trigger('change',this);
            this.pos.gui.screen_instances.products.order_widget.renderElement(true);
        },
        get_note: function(){
            if (this.note) {
                return this.note;
            } else return false;
        },
        export_as_JSON: function() {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.note = this.note;
            data.old_note = this.old_note;
            return data;
        },
        init_from_JSON: function(json) {
            this.note = json.note;
            this.old_note = json.old_note;
            _super_order.init_from_JSON.call(this, json);
        },
        saveChanges: function(){
            this.old_note = this.get_note();
            _super_order.saveChanges.call(this, arguments);
        },
        computeChanges: function(categories){
            var res = _super_order.computeChanges.apply(this, arguments);
            var self = this;
            var old_order_note = this.old_note || false;
            var current_order_note = this.get_note();
            if (old_order_note != current_order_note) {
                if ( res['new'].length == 0 && res['cancelled'].length == 0){
                    if (current_order_note) {
                        res.new.push({
                            name: "Order Note",
                            qty: 1,
                        });
                    }
                    if (old_order_note) {
                        res.cancelled.push({
                            name: "Order Note",
                            qty: 1,
                        })
                        res.old_order_note = old_order_note;
                    }
                }
            }
            res.order_note = current_order_note;
            return res
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            _super_orderline.initialize.apply(this,arguments);
            if (this.product.note && !this.note) {
                this.set_note(this.product.note);
            }
        },
    });

    PosBaseWidget.include({
        init:function(parent,options){
            var self = this;
            this._super(parent,options);
            if (this.gui && this.gui.screen_instances.products && this.gui.screen_instances.products.action_buttons.orderline_note) {
                this.gui.screen_instances.products.action_buttons.orderline_note.button_click = function() {
                    var order = this.pos.get_order();
                    var line = order.get_selected_orderline();
                    var title = '';
                    var value = '';
                    if (order.note_type == "Order") {
                        title = _t('Add Note for Order');
                        value = order.get_note();
                    } else {
                        if (line) {
                            order.note_type = "Product";
                            title = _t('Add Note for Product');
                            value = line.get_note();
                        }
                    }
                    if (line) {
                        this.gui.show_popup('product_notes',{
                            title: title,
                            notes: self.pos.product_notes.slice(0,8),
                            value: value,
                            confirm: function(note) {
                                if (order.note_type == "Order") {
                                    order.set_note(note);
                                } else if (order.note_type = "Product") {
                                    line.set_note(note);
                                }
                            },
                        });
                    }
                };
            }
        }
    });

    var ProductNotesPopupWidget = PopupWidget.extend({
        template: 'ProductNotesPopupWidget',
        show: function(options){
            options = options || {};
            this._super(options);
            if (options.notes) {
                this.events["click .product_note .button"] = "click_product_note_button";
                this.events["click .note_type .button"] = "click_note_type"
            }
            this.renderElement();
            this.render_active_element();
        },
        render_active_element: function() {
            var order = this.pos.get_order();
            var product_type = $(".note_type .product_type");
            var order_type = $(".note_type .order_type");
            if (order.note_type == "Order") {
                if (product_type.hasClass("active")){
                    product_type.removeClass("active");
                }
                order_type.addClass("active");
            } else if (order.note_type == "Product") {
                if (order_type.hasClass("active")){
                    order_type.removeClass("active");
                }
                product_type.addClass("active");
            }

        },
        get_note_by_id: function(id) {
            var note = this.options.notes.filter(function (item) {
                return item.id === Number(id);
            });
            return note[0];
        },
        click_note_type: function(e) {
            var order = this.pos.get_order();
            var old_note_type = {};
            old_note_type.note_type = order.note_type;
            if (e.currentTarget.classList[0]=="product_type"){
                order.note_type = "Product"
            } else if (e.currentTarget.classList[0]=="order_type"){
                order.note_type = "Order"
            }
            if (old_note_type.note_type != order.note_type) {
                this.gui.screen_instances.products.action_buttons.orderline_note.button_click();
            }
        },
        click_product_note_button: function(e) {
            var self = this;
            var id = e.currentTarget.id;
            if (id == 'other') {
                self.gui.show_screen('notes_screen');
            } else {
                this.$('.popup-confirm-note textarea').val(this.get_note_by_id(id).name);
            }
        },
        click_confirm: function(){
            this.gui.close_popup();
            if( this.options.confirm ){
                var value = this.$('.popup-confirm-note textarea').val();
                this.options.confirm.call(this, value);
            }
        },
    });
    gui.define_popup({name:'product_notes', widget: ProductNotesPopupWidget});

    var ProducNotesScreenWidget = screens.ScreenWidget.extend({
        template: 'ProducNotesScreenWidget',
        events: {
            'click .note-line': function (event) {
                var line = $('.note-line#'+parseInt(event.currentTarget.id));
                this.line_select(line, parseInt(event.currentTarget.id));
            },
            'click .note-back': function () {
                this.gui.back();
            },
            'click .note-next': function () {
                this.save_changes();
                this.gui.back();
            },
        },
        init: function(parent, options){
            this._super(parent, options);
            this.notes_cache = new screens.DomCache();
            var self = this;
        },
        auto_back: true,
        show: function(){
            var self = this;
            this._super();
            this.show_next_note_button = false;
            var product_notes = self.pos.product_notes;
            this.render_list(product_notes);
        },
        render_list: function(notes){
            var contents = this.$el[0].querySelector('.note-list-contents');
            contents.innerHTML = "";
            for(var i = 0, len = Math.min(notes.length,1000); i < len; i++){
                var note = notes[i];
                var product_note = this.notes_cache.get_node(note.id);
                if(!product_note){
                    var product_note_html = QWeb.render('ProductNotes',{widget: this, note:notes[i]});
                    product_note = document.createElement('tbody');
                    product_note.innerHTML = product_note_html;
                    product_note = product_note.childNodes[1];
                    this.notes_cache.cache_node(note.id,product_note);
                }
                product_note.classList.remove('highlight');
                contents.appendChild(product_note);
            }
        },
        save_changes: function(){
            var self = this;
            var order = this.pos.get_order();
            var line = order.get_selected_orderline();
            var note = $('.note-line#'+this.old_id+' td').text();
            if (order.note_type == "Order") {
                order.set_note(note);
            } else if (order.note_type = "Product") {
                line.set_note(note);
            }
        },
        toggle_save_button: function(){
            var $button = this.$('.button.next');
            if (!this.show_next_note_button) {
                $button.addClass('oe_hidden');
                return;
            } else {
                $button.removeClass('oe_hidden');
                $button.text(_t('Apply'));
            }
        },
        line_select: function(line,id){
            if (this.old_id !== id) {
                this.show_next_note_button = true;
                this.old_id = id;
            }
            if ( line.hasClass('highlight') ){
                line.removeClass('highlight');
                this.show_next_note_button = false;
            }else{
                this.$('.note-list .highlight').removeClass('highlight');
                line.addClass('highlight');
                this.show_next_note_button = true;
            }
            this.toggle_save_button();
        },
    });
    gui.define_screen({name:'notes_screen', widget: ProducNotesScreenWidget});
});
