odoo.define('pos_order_note', function (require) {
    "use strict";

    var models = require('pos_restaurant_base.models');
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
        model: 'pos.product_notes',
        fields: ['name', 'sequence', 'pos_category_ids'],
        condition: function(self) {
            // load all notes for the restaurant only (because of the Note button available in the restaurant only)
            return self.config.module_pos_restaurant;
        },
        loaded: function(self,product_notes){
            var sorting_product_notes = function(idOne, idTwo){
                return idOne.sequence - idTwo.sequence;
            };
            if (product_notes) {
                self.product_notes = product_notes.sort(sorting_product_notes);
            }
        },
    });

    models.load_fields('product.product',['pos_notes']);

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        set_note: function(note){
            this.old_note = this.note;
            this.note = note;
            this.trigger('change',this);
            this.trigger('new_updates_to_send');
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
            this.trigger('new_updates_to_send');
            this.trigger('change', this);
        },
        set_old_custom_notes: function(notes) {
            this.old_custom_notes = notes;
            this.trigger('new_updates_to_send');
            this.trigger('change', this);
        },
        get_custom_notes: function() {
            if (this.custom_notes && this.custom_notes.length) {
                return this.custom_notes;
            }
            return false;
        },
        get_line_resume: function(line) {
            var res = _super_order.get_line_resume.apply(this, arguments);
            res.custom_notes = line.get_custom_notes() || false;
            res.old_custom_notes = line.old_custom_notes || false;
            return res;
        },
        // This function is used to sync notes data accross all POSes
        // (only when pos_multi_session is installed)
        apply_ms_data: function(data) {
            if (_super_order.apply_ms_data) {
                _super_order.apply_ms_data.apply(this, arguments);
            }
            this.note = data.note;
            this.old_note = data.old_note;
            this.custom_notes = data.custom_notes;
            this.old_custom_notes = data.old_custom_notes;
            var current_order = this.pos.get_order();
            if (current_order && this.uid === current_order.uid && this.pos.gui.screen_instances.products) {
                this.pos.gui.screen_instances.products.order_widget.renderElement(true);
            }
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
        // TODO: make fast
        computeChanges: function(categories, config){
            var current_res = this.build_line_resume();
            var old_res = this.saved_resume || {};

            var line_hash = false;
            var res = _super_order.computeChanges.apply(this, arguments);

            var old_order_note = this.old_note || false;
            var old_order_custom_notes = this.old_custom_notes || false;

            var current_order_note = this.get_note();
            var current_order_custom_notes = this.get_custom_notes();

            if (this.change_custom_notes()) {
                if (current_order_custom_notes) {
                    res.new.push({
                        name: "Order Note",
                        name_wrapped:["Order Note"],
                        qty: 1,
                        order: true,
                    });
                }
                if (old_order_custom_notes) {
                    res.cancelled.push({
                        name: "Order Note",
                        name_wrapped:["Order Note"],
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
                        name_wrapped:["Order Note"],
                        qty: 1,
                        order: true,
                    });
                }
                if (old_order_note) {
                    res.cancelled.push({
                        name: "Order Note",
                        name_wrapped:["Order Note"],
                        qty: 1,
                        order: true,
                    });
                    res.old_order_note = old_order_note;
                }
            }

            res.order_note = current_order_note;
            res.order_custom_notes = current_order_custom_notes;

            for (line_hash in current_res) {
                if (Object.prototype.hasOwnProperty.call(current_res, line_hash)) {
                    var curr = current_res[line_hash];
                    var old = old_res[line_hash];
                    var current_line_id = curr.line_id;

                    var new_exist_change = _.find(res.new, function(r) {
                        return r.line_id === current_line_id;
                    });

                    if (new_exist_change && curr.custom_notes) {
                        new_exist_change.custom_notes = curr.custom_notes;
                    }

                    var cancelled_exist_change = _.find(res.cancelled, function(r) {
                        return r.line_id === current_line_id;
                    });
                    if (cancelled_exist_change && curr.old_custom_notes && curr.old_custom_notes !== curr.custom_notes) {
                        cancelled_exist_change.custom_notes = curr.old_custom_notes;
                    }
                }
            }
            return res;
        },
        change_custom_notes: function() {
            var old_order_custom_notes = this.old_custom_notes || false;
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

            var change_custom_notes = false;
            if (current_order_custom_notes_ids.length === old_order_custom_notes_ids.length) {
                var difference = this.DiffArrays(current_order_custom_notes_ids, old_order_custom_notes_ids);
                if (difference.length) {
                    change_custom_notes = true;
                }
            } else {
                change_custom_notes = true;
            }
            return change_custom_notes;
        },
        DiffArrays: function(A,B) {
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
        }
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            _super_orderline.initialize.apply(this,arguments);
            if (this.product.pos_notes && !this.note) {
                this.set_note(this.product.pos_notes);
            }
        },
        set_custom_notes: function(notes) {
            this.custom_notes = notes;
            this.trigger('change', this);
            this.order.trigger('new_updates_to_send');
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
            this.order.trigger('new_updates_to_send');
        },
        can_be_merged_with: function(orderline){
            var res = _super_orderline.can_be_merged_with.call(this, orderline);
            if(this.get_note() || this.get_custom_notes() || orderline.get_note()){
                return false;
            }
            return res;
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
            var res = _super_orderline.get_line_diff_hash.apply(this,arguments);
            if (this.get_custom_notes()) {
                _.each(this.get_custom_notes(), function(custom_notes) {
                    custom_notes_ids.push(custom_notes.id);
                });
                custom_notes_ids_line = custom_notes_ids.join('');
            }
            var id = this.uid || this.id;
            if (this.get_note()) {
                if(this.get_custom_notes()) {
                    return res + '|' + custom_notes_ids_line;
                }
                return res;
            }
            if(this.get_custom_notes()) {
               return id + '|' + custom_notes_ids_line;
            }
            return res;
        },
        clone: function(){
            var orderline = _super_orderline.clone.call(this);
            orderline.custom_notes = this.custom_notes;
            return orderline;
        },
        //  Read more about this function in pos_multi_session module
        apply_ms_data: function(data) {
            if (_super_orderline.apply_ms_data) {
                _super_orderline.apply_ms_data.apply(this, arguments);
            }
            this.custom_notes = data.custom_notes;
            this.old_custom_notes = data.old_custom_notes;
            this.trigger('change', this);
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
            var notes = this.pos.product_notes;
            if (notes) {
                this.events["click .product_note .button"] = "click_note_button";
                this.events["click .note_type .button"] = "click_note_type";
                this.notes = notes;
                this.all_notes = notes;
            }
            this.notes.forEach(function(note) {
                note.active = false;
            });

            this.custom_order_ids = options.custom_order_ids || false;
            this.custom_product_ids = options.custom_product_ids || false;

            this.set_active_note_buttons();
            this.set_available_notes();
            this.renderElement();
            this.render_active_note_type();
        },
        set_active_note_buttons: function() {
            if (!this.notes) {
                return false;
            }
            var self = this;
            var custom_notes = false;
            if (this.get_note_type() === "Order") {
               custom_notes = this.custom_order_ids;
            } else if (this.get_note_type() === "Product") {
                custom_notes = this.custom_product_ids;
            }
            if (custom_notes && custom_notes.length) {
                custom_notes.forEach(function(note) {
                    var exist_note = _.find(self.notes, function(n) {
                        return note.id === n.id;
                    });
                    if (exist_note) {
                        exist_note.active = true;
                    }
                });
            }
        },
        set_available_notes: function() {
            var type = this.get_note_type();
            if (type === "Order") {
                this.notes = this.all_notes;
            }
            if (type === "Product") {
                var order = this.pos.get_order();
                var orderline = order.get_selected_orderline();
                var category_ids = [];
                if (orderline.product.pos_categ_id && orderline.product.pos_categ_id.length) {
                    category_ids = [orderline.product.pos_categ_id[0]];
                } else if (orderline.product.pos_category_ids) {
                    category_ids = orderline.product.pos_category_ids;
                }
                this.notes = this.get_notes_by_category_ids(category_ids);
            }
        },
        get_notes_by_category_ids: function(category_ids) {
            var self = this;

            var cat_ids = [];
            function get_parent_category_ids(child_category_id) {
                if (cat_ids.indexOf(child_category_id) === -1) {
                    cat_ids.push(child_category_id);
                }
                var parent_category_id = self.pos.db.get_category_parent_id(child_category_id);
                if (parent_category_id && parent_category_id !== 0) {
                    cat_ids.push(parent_category_id);
                    return get_parent_category_ids(parent_category_id);
                }
                return cat_ids;
            }

            var all_categories_ids = [];
            category_ids.forEach(function(id) {
                all_categories_ids = all_categories_ids.concat(get_parent_category_ids(id));
            });
            all_categories_ids = _.uniq(all_categories_ids);

            return this.all_notes.filter(function(note) {
                if (_.isEmpty(note.pos_category_ids)) {
                    return true;
                }
                var res = _.intersection(note.pos_category_ids, all_categories_ids);
                if (_.isEmpty(res)) {
                    return false;
                }
                return true;
            });
        },
        render_active_note_type: function() {
            var product_type = $(".note_type .product_type");
            var order_type = $(".note_type .order_type");
            if (this.get_note_type() === "Order") {
                if (product_type.hasClass("active")){
                    product_type.removeClass("active");
                }
                order_type.addClass("active");
            } else if (this.get_note_type() === "Product") {
                if (order_type.hasClass("active")){
                    order_type.removeClass("active");
                }
                product_type.addClass("active");
            }
        },
        get_note_type: function() {
            return this.pos.get_order().note_type;
        },
        set_note_type: function(type) {
            var order = this.pos.get_order();
            order.note_type = type;
        },
        get_note_by_id: function(id) {
            return _.find(this.notes, function(item) {
                return item.id === Number(id);
            });
        },
        click_note_type: function(e) {
            var old_note_type = {};
            old_note_type.note_type = this.get_note_type();
            if (e.currentTarget.classList[0] === "product_type"){
                this.set_note_type("Product");
            } else if (e.currentTarget.classList[0] === "order_type"){
                this.set_note_type("Order");
            }
            if (old_note_type.note_type !== this.get_note_type()) {
                this.gui.screen_instances.products.action_buttons.orderline_note.button_click();
            }
        },
        click_note_button: function(e) {
            var self = this;
            var id = e.currentTarget.getAttribute('data-id');
            if (id === 'other') {
                self.gui.show_screen('notes_screen', {notes: this.notes});
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
            this.gui.close_popup();
            var value = {};
            var notes = this.notes.filter(function(note){
                return note.active === true;
            });

            if (this.get_note_type() === "Order") {
                value.custom_order_ids = notes;
            } else if (this.get_note_type() === "Product") {
                value.custom_product_ids = notes;
            }

            if (this.options.confirm){
                value.note = this.$('.popup-confirm-note textarea').val();
                this.options.confirm.call(this, value);
            }
        }
    });
    gui.define_popup({name:'product_notes', widget: ProductNotesPopupWidget});

    var ProductNotesScreenWidget = screens.ScreenWidget.extend({
        template: 'ProductNotesScreenWidget',
        events: {
            'click .note-line': function (event) {
                var id = event.currentTarget.getAttribute('data-id');
                var line = $('.note-list-contents').find(".note-line[data-id='" +parseInt(id)+"']");
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
            this._super();
            this.notes = this.gui.get_current_screen_param('notes');
            this.render_list(this.notes);
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
            return _.find(this.notes, function(item) {
                return item.id === Number(id);
            });
        },
    });
    gui.define_screen({name:'notes_screen', widget: ProductNotesScreenWidget});

    gui.Gui.include({
        show_screen: function(screen_name, params, refresh, skip_close_popup) {
            this._super(screen_name, params, refresh, skip_close_popup);

            //compatibility with pos_mobile_restaurant
            if (odoo.is_mobile && screen_name === 'notes_screen') {
                var height = this.current_screen.$('table.note-list').height();
                var max_height = this.current_screen.$('.full-content').height();
                if (height > max_height) {
                    height = max_height;
                }
                this.current_screen.$('.subwindow-container-fix.touch-scrollable.scrollable-y').css({
                    'height': height
                });
                this.current_screen.$('.subwindow-container-fix.touch-scrollable.scrollable-y').getNiceScroll().resize();
            }
        }
    });
});
