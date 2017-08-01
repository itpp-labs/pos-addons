odoo.define('pos_cancel_order.order_note', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var multiprint = require('pos_restaurant.multiprint');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var PopupWidget = require('point_of_sale.popups');
    var splitbill = require('pos_restaurant.splitbill');

    var QWeb = core.qweb;
    var _t = core._t;


    models.load_models({
        model:  'product.template',
        fields: ['pos_notes','product_variant_id'],
        loaded: function(self,products){
            products.forEach(function(item){
                if (item.product_variant_id) {
                    var product = self.db.get_product_by_id(item.product_variant_id[0]);
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
            this.old_note = this.note;
            this.note = note;
            this.trigger('change',this);
            this.pos.gui.screen_instances.products.order_widget.renderElement(true);
        },
        get_note: function(){
            if (this.note) {
                return this.note;
            }
            return false;
        },
        set_custom_notes: function(notes) {
            this.old_custom_notes = this.custom_notes;
            this.custom_notes = notes;
            this.trigger('change', this);
        },
        set_old_custom_notes: function(notes) {
            this.old_custom_notes = notes;
            this.trigger('change', this);
        },
        get_custom_notes: function() {
            if (this.custom_notes && this.custom_notes.length) {
                return this.custom_notes;
            }
            return false;
        },
        build_line_resume: function(){
            var res = _super_order.build_line_resume.apply(this, arguments);
            this.orderlines.each(function(line){
                if (line.mp_skip) {
                    return;
                }
                var line_hash = line.get_line_diff_hash();
                var custom_notes = line.get_custom_notes();
                var old_custom_notes = line.old_custom_notes || false;
                res[line_hash].custom_notes = custom_notes;
                res[line_hash].old_custom_notes = old_custom_notes;
            });
            return res;
        },
        export_as_JSON: function() {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.note = this.note;
            data.old_note = this.old_note;
            data.custom_notes = this.custom_notes;
            data.old_custom_notes = this.old_custom_notes;
            return data;
        },
        init_from_JSON: function(json) {
            this.note = json.note;
            this.old_note = json.old_note;
            this.custom_notes = json.custom_notes;
            this.old_custom_notes = json.old_custom_notes;
            _super_order.init_from_JSON.call(this, json);
        },
        saveChanges: function(){
            this.old_note = this.get_note();
            this.old_custom_notes = this.get_custom_notes();
            _super_order.saveChanges.call(this, arguments);
        },
        computeChanges: function(categories){
            var current_res = this.build_line_resume();
            var old_res = this.saved_resume || {};
            var json = this.export_as_JSON();
            var add = [];
            var rem = [];
            var line_hash;

            var res = _super_order.computeChanges.apply(this, arguments);

            var old_order_note = this.old_note || false;
            var old_order_custom_notes = this.old_custom_notes || false;

            var current_order_note = this.get_note();
            var current_order_custom_notes = this.get_custom_notes();
            var old_order_custom_notes_ids = [];
            var current_order_custom_notes_ids = [];
            if (old_order_custom_notes) {
                old_order_custom_notes.forEach(function(old_note) {
                    old_order_custom_notes_ids.push(old_note.id);
                });
            }
            if (current_order_custom_notes) {
                current_order_custom_notes.forEach(function(current_note) {
                    current_order_custom_notes_ids.push(current_note.id);
                });
            }

            var DiffArrays = function(A,B) {
                var M = A.length, N = B.length, c = 0, C = [];
                for (var i = 0; i < M; i++) {
                    var j = 0, k = 0;
                    while (B[j] !== A[ i ] && j < N) {
                        j++;
                    }
                    while (C[k] !== A[ i ] && k < c) {
                        k++;
                    }
                    if (j === N && k === c) {
                        C[c++] = A[ i ];
                    }
                }
                return C;
            };
            var change_custom_notes = false;
            if (current_order_custom_notes_ids.length === old_order_custom_notes_ids.length) {
                var difference = DiffArrays(current_order_custom_notes_ids, old_order_custom_notes_ids);
                if (difference.length) {
                    change_custom_notes = true;
                }
            } else {
                change_custom_notes = true;
            }
            if (change_custom_notes) {
                if (current_order_custom_notes) {
                    res.new.push({
                        name: "Order Note",
                        qty: 1,
                        order: true,
                    });
                }
                if (old_order_custom_notes) {
                    res.cancelled.push({
                        name: "Order Note",
                        qty: 1,
                        order: true,
                    });
                    res.old_order_custom_notes = old_order_custom_notes;
                }
            }

            if (old_order_note !== current_order_note) {
                if (current_order_note) {
                    res.new.push({
                        name: "Order Note",
                        qty: 1,
                        order: true,
                    });
                }
                if (old_order_note) {
                    res.cancelled.push({
                        name: "Order Note",
                        qty: 1,
                        order: true,
                    });
                    res.old_order_note = old_order_note;
                }
            }

            res.order_note = current_order_note;
            res.order_custom_notes = current_order_custom_notes;

            for (line_hash in current_res) {
                var curr = current_res[line_hash];
                var old = old_res[line_hash];
                var current_product = curr.product_id;
                var new_exist_product = false;
                var cancelled_exist_product = false;
                if (res.new) {
                    new_exist_product = res.new.find(function(product) {
                        return product.id === current_product;
                    });
                }
                if (res.cancelled) {
                    cancelled_exist_product = res.cancelled.find(function(product) {
                        return product.id === current_product;
                    });
                }
                if (new_exist_product && curr.custom_notes) {
                    new_exist_product.custom_notes = curr.custom_notes;
                }
                if (cancelled_exist_product && curr.old_custom_notes) {
                    if (curr.old_custom_notes && curr.old_custom_notes !== curr.custom_notes) {
                        cancelled_exist_product.custom_notes = curr.old_custom_notes;
                    }
                }
            }
            return res;
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
        set_custom_notes: function(notes) {
            this.custom_notes = notes;
            this.trigger('change', this);
        },
        get_custom_notes: function() {
            if (this.custom_notes && this.custom_notes.length) {
                return this.custom_notes;
            }
            return false;
        },
        set_old_custom_notes: function(notes) {
            this.old_custom_notes = notes;
            this.trigger('change', this);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.custom_notes = this.custom_notes;
            data.old_custom_notes = this.old_custom_notes;
            return data;
        },
        init_from_JSON: function(json) {
            this.custom_notes = json.custom_notes;
            this.old_custom_notes = json.old_custom_notes;
            _super_orderline.init_from_JSON.call(this, json);
        },
        get_line_diff_hash: function() {
            var custom_notes_ids = [];
            var custom_notes_ids_line = false;
            if (this.get_custom_notes()) {
                this.get_custom_notes().forEach(function(custom_notes) {
                    custom_notes_ids.push(custom_notes.id);
                });
                custom_notes_ids_line = custom_notes_ids.join('');
            }
            if (this.get_note()) {
                if(this.get_custom_notes()) {
                    return this.id + '|' + this.get_note() + '|' + custom_notes_ids_line;
                } else {
                    return _super_orderline.get_line_diff_hash.apply(this,arguments);
                }
            } else {
                if(this.get_custom_notes()) {
                    return this.id + '|' + custom_notes_ids_line;
                }
                return _super_orderline.get_line_diff_hash.apply(this,arguments);
            }
        },
        clone: function(){
            var orderline = _super_orderline.clone.call(this);
            orderline.custom_notes = this.custom_notes;
            return orderline;
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
                    if (order.note_type === "Order") {
                        title = _t('Add Note for Order');
                        value = order.get_note();
                    } else if (line) {
                        order.note_type = "Product";
                        title = _t('Add Note for Product');
                        value = line.get_note();
                    }
                    if (line) {
                        var old_line_custom_notes = false;
                        if (line.get_custom_notes()) {
                            old_line_custom_notes = line.get_custom_notes().concat();
                            line.set_old_custom_notes(old_line_custom_notes);
                        }
                        this.gui.show_popup('product_notes',{
                            title: title,
                            notes: self.pos.product_notes,
                            value: value,
                            custom_order_ids: order.get_custom_notes(),
                            custom_product_ids: line.get_custom_notes(),
                            confirm: function(res) {
                                if (order.note_type === "Order") {
                                    order.set_custom_notes(res.custom_order_ids);
                                    order.set_note(res.note);
                                }
                                if (order.note_type === "Product") {
                                    line.set_custom_notes(res.custom_product_ids);
                                    line.set_note(res.note);
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
        show: function(options) {
            options = options || {};
            this._super(options);
            if (options.notes) {
                this.events["click .product_note .button"] = "click_note_button";
                this.events["click .note_type .button"] = "click_note_type";
                this.notes = options.notes;
            }
            this.notes.forEach(function(note) {
                note.active = false;
            });

            this.custom_order_ids = options.custom_order_ids || false;
            this.custom_product_ids = options.custom_product_ids || false;

            this.set_active_note_buttons();
            this.renderElement();
            this.render_active_note_type();
        },
        set_active_note_buttons: function() {
            if (!this.notes) {
                return false;
            }
            var self = this;
            var order = this.pos.get_order();
            var custom_notes = false;
            if (order.note_type === "Order") {
               custom_notes = this.custom_order_ids;
            } else if (order.note_type === "Product") {
                custom_notes = this.custom_product_ids;
            }
            if (custom_notes && custom_notes.length) {
                this.notes.forEach(function(note) {
                    var res = custom_notes.find(function(element) {
                        return String(note.number) === String(element.number);
                    });
                    if (res) {
                        note.active = true;
                    }
                });
            }
        },
        render_active_note_type: function() {
            var order = this.pos.get_order();
            var product_type = $(".note_type .product_type");
            var order_type = $(".note_type .order_type");
            if (order.note_type === "Order") {
                if (product_type.hasClass("active")){
                    product_type.removeClass("active");
                }
                order_type.addClass("active");
            } else if (order.note_type === "Product") {
                if (order_type.hasClass("active")){
                    order_type.removeClass("active");
                }
                product_type.addClass("active");
            }
        },
        get_note_by_id: function(id) {
            return this.notes.find(function (item) {
                return item.id === Number(id);
            });
        },
        click_note_type: function(e) {
            var order = this.pos.get_order();
            var old_note_type = {};
            old_note_type.note_type = order.note_type;
            if (e.currentTarget.classList[0] === "product_type"){
                order.note_type = "Product";
            } else if (e.currentTarget.classList[0] === "order_type"){
                order.note_type = "Order";
            }
            if (old_note_type.note_type !== order.note_type) {
                this.gui.screen_instances.products.action_buttons.orderline_note.button_click();
            }
        },
        click_note_button: function(e) {
            var self = this;
            var id = e.currentTarget.id;
            if (id === 'other') {
                self.gui.show_screen('notes_screen');
            } else {
                self.set_active_note_status($(e.target), Number(id));
            }
        },
        set_active_note_status: function(note_obj, id){
            if (note_obj.hasClass("active")) {
                note_obj.removeClass("active");
                this.get_note_by_id(id).active = false;
            } else {
                note_obj.addClass("active");
                this.get_note_by_id(id).active = true;
            }
        },
        click_confirm: function(){
            var self = this;
            this.gui.close_popup();
            var order = this.pos.get_order();
            var value = {};
            var notes = this.notes.filter(function(note){
                return note.active === true;
            });

            if (order.note_type === "Order") {
                value.custom_order_ids = notes;
            } else if (order.note_type === "Product") {
                value.custom_product_ids = notes;
            }

            if (this.options.confirm){
                value.note = this.$('.popup-confirm-note textarea').val();
                this.options.confirm.call(this, value);
            }
        },
    });
    gui.define_popup({name:'product_notes', widget: ProductNotesPopupWidget});

    var ProducNotesScreenWidget = screens.ScreenWidget.extend({
        template: 'ProducNotesScreenWidget',
        events: {
            'click .note-line': function (event) {
                var id = event.currentTarget.id;
                var line = $('.note-line#'+parseInt(event.currentTarget.id));
                this.set_active_note_status(line, Number(id));
            },
            'click .note-back': function () {
                this.gui.back();
            },
            'click .note-next': function () {
                this.save_changes();
                this.gui.back();
            },
        },
        auto_back: true,
        show: function(){
            var self = this;
            this._super();
            this.show_next_note_button = false;
            this.notes = this.pos.product_notes;
            this.set_active_note_buttons();
            this.render_list(this.notes);
        },
        set_active_note_buttons: function() {
            if (!this.notes) {
                return false;
            }
            var self = this;
            var order = this.pos.get_order();
            var custom_notes = false;
            if (order.note_type === "Order") {
               custom_notes = this.custom_order_ids;
            } else if (order.note_type === "Product") {
                custom_notes = this.custom_product_ids;
            }
            if (custom_notes && custom_notes.length) {
                this.notes.forEach(function(note) {
                    var res = custom_notes.find(function(element) {
                        return String(note.number) === String(element.number);
                    });
                    if (res) {
                        note.active = true;
                    }
                });
            }
        },
        set_active_note_status: function(note_obj, id){
            if (note_obj.hasClass("highlight")) {
                note_obj.removeClass("highlight");
                this.get_note_by_id(id).active = false;
            } else {
                note_obj.addClass("highlight");
                this.get_note_by_id(id).active = true;
            }
        },
        render_list: function(notes){
            var contents = this.$el[0].querySelector('.note-list-contents');
            contents.innerHTML = "";
            for(var i = 0, len = Math.min(notes.length,1000); i < len; i++){
                var note = notes[i];
                var product_note_html = QWeb.render('ProductNotes',{widget: this, note:notes[i]});
                var product_note = document.createElement('tbody');
                product_note.innerHTML = product_note_html;
                product_note = product_note.childNodes[1];

                if (notes[i].active) {
                    product_note.classList.add('highlight');
                } else {
                    product_note.classList.remove('highlight');
                }
                contents.appendChild(product_note);
            }
        },
        save_changes: function(){
            var order = this.pos.get_order();
            var line = order.get_selected_orderline();

            var notes = this.notes.filter(function(note){
                return note.active === true;
            });

            var simple_note = $('.popup-confirm-note textarea').val();

            if (order.note_type === "Order") {
                order.set_custom_notes(notes);
                order.set_note(simple_note);
            } else if (order.note_type === "Product") {
                line.set_custom_notes(notes);
                line.set_note(simple_note);
            }
        },
        get_note_by_id: function(id) {
            return this.notes.find(function (item) {
                return item.id === Number(id);
            });
        },
    });
    gui.define_screen({name:'notes_screen', widget: ProducNotesScreenWidget});
});
