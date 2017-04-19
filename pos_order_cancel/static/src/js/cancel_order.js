odoo.define('pos_order_cancel', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var multiprint = require('pos_restaurant.multiprint');
    var PopupWidget = require('point_of_sale.popups');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var Model = require('web.DataModel');
    var QWeb = core.qweb;
    var _t = core._t;

    gui.Gui.include({
        back: function() {
            if (this.pos.get_order()){
                this._super();
            }
        }
    });

    models.load_models({
        model: 'pos.cancelled_reason',
        fields: ['name', 'number'],
        loaded: function(self,cancelled_reason){
            var sorting_cancelled_reason = function(idOne, idTwo){
                return idOne.number - idTwo.number;
            };
            if (cancelled_reason) {
                self.cancelled_reason = cancelled_reason.sort(sorting_cancelled_reason);
            }
        },
    });

    chrome.OrderSelectorWidget.include({
        deleteorder_click_handler: function(event, $el) {
            var self = this;
            var order = this.pos.get_order();
            var show_popup = false;
            if ( !order.is_empty() ){
                var lines = order.get_printed_order_lines(false);
                if (lines.length > 0) {
                    show_popup = true;
                }
                if (show_popup) {
                    this.gui.screen_instances.products.order_widget.show_popup('order');
                } else{
                    this._super(event, $el);
                }
            } else if (order.is_empty()) {
                this._super(event, $el);
            }
        },
    });

    screens.OrderWidget.include({
        init: function(parent, options) {
            this._super(parent,options);
            this.numpad_state.bind('show_popup', this.show_popup, this);
            this.pos.selected_cancelled_reason = '';
        },
        show_popup: function(type){
            var self = this;
            var order = this.pos.get_order();
            var order_line = order.get_selected_orderline();
            this.numpad_state.show_popup = true;
            if (!order_line && type === 'product') {
                return false;
            }
            if (order_line && !order_line.was_printed && type === 'product') {
                this.numpad_state.show_popup = false;
                return false;
            }
            var title = 'Order ';
            if (type === 'product') {
                title = 'Product ';
            }
            // type of object which is removed (product or order)
            order.CancellationReasonType = type;
            this.gui.show_popup('confirm-cancellation',{
                'title': _t(title + 'Cancellation Reason'),
                'reasons': self.pos.cancelled_reason.slice(0,8),
                'value': self.pos.selected_cancelled_reason.name,
                confirm: function(){
                    if (type === 'product') {
                        self.set_value('remove');
                        order.was_removed_product = true;
                        order.printChanges();
                        order.saveChanges();
                        order.CancellationReason = '';
                    } else {
                        order.save_cancellation_order_to_server();
                    }
                },
            });
        },
    });

    var NumpadSuper = models.NumpadState;
    models.NumpadState = models.NumpadState.extend({
        deleteLastChar: function() {
            if(this.get('buffer') === "" && this.get('mode') === 'quantity'){
                this.trigger('show_popup', 'product');
                if (!this.show_popup) {
                    NumpadSuper.prototype.deleteLastChar.apply(this, arguments);
                }
            } else {
                NumpadSuper.prototype.deleteLastChar.apply(this, arguments);
            }
        },
    });

    var ConfirmCancellationPopupWidget = PopupWidget.extend({
        template: 'ConfirmCancellationPopupWidget',
        show: function(options){
            this._super(options);
            if (options.reasons) {
                this.events["click .cancelled-reason .button"] = "click_cancelled_reason";
            }
            this.renderElement();
        },
        get_reason_by_id: function(id) {
            var reason = this.options.reasons.filter(function (item) {
                return item.id === Number(id);
            });
            return reason[0];
        },
        click_cancelled_reason: function(e) {
            var self = this;
            var id = e.currentTarget.id;
            if (id === 'other') {
                var skip_close_popup = true;
                self.gui.show_screen('reason_screen');
            } else {
                this.$('.popup-confirm-cancellation textarea').val(this.get_reason_by_id(id).name);
            }
        },
        click_confirm: function(){
            this.gui.close_popup();
            if( this.options.confirm ){
                var order = this.pos.get_order();
                order.CancellationReason = this.$('.popup-confirm-cancellation textarea').val();
                this.options.confirm.call(this);
            }
        },
    });
    gui.define_popup({name:'confirm-cancellation', widget: ConfirmCancellationPopupWidget});

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(){
            var self = this;
            _super_orderline.initialize.apply(this, arguments);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.was_printed = this.was_printed;
            return data;
        },
        init_from_JSON: function(json) {
            this.was_printed = json.was_printed;
            _super_orderline.init_from_JSON.call(this, json);
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        saveChanges: function(){
            var self = this;
            if (this.was_removed_product) {
                var mp_dirty_status = true;
                var not_printed_lines = this.get_printed_order_lines(mp_dirty_status);
                this.trigger('change',this);
                this.saved_resume = this.build_line_resume();
                not_printed_lines.forEach(function (item) {
                    delete self.saved_resume[item.id];
                });
                this.trigger('change',this);
                this.was_removed_product = false;
            } else {
                _super_order.saveChanges.call(this, arguments);
            }
            var lines = this.get_printed_order_lines(false);
            lines.forEach(function(line){
                line.was_printed = true;
            });
        },
        get_printed_order_lines: function(mp_dirty_status) {
            var lines = this.get_orderlines();
            lines = lines.filter(function(line){
                return line.mp_dirty === mp_dirty_status;
            });
            var printers = this.pos.printers;
            var categories_ids = [];
            for(var i = 0; i < printers.length; i++) {
                var product_categories_ids = printers[i].config.product_categories_ids;
                product_categories_ids.forEach(function(id){
                    categories_ids.push(id);
                });
            }
            var unique_categories_ids = [];
            this.unique(categories_ids).forEach(function(id){
                unique_categories_ids.push(Number(id));
            });
            var new_lines = [];
            unique_categories_ids.forEach(function(id){
                lines.forEach(function(line){
                    if (line.product.pos_categ_id[0] === id) {
                        new_lines.push(line);
                    }
                });
            });
            if (new_lines.length === 0) {
                this.сancel_button_available = false;
            } else {
                this.сancel_button_available = true;
            }
            return new_lines;
        },
        unique: function(arr){
            var obj = {};
            for (var i = 0; i < arr.length; i++) {
                var str = arr[i];
                obj[str] = true;
            }
            return Object.keys(obj);
        },
        computeChanges: function(categories){
            var res = _super_order.computeChanges.apply(this, arguments);
            if (this.was_removed_product) {
                res.new = [];
            }
            if (this.CancellationReason) {
                res.reason = this.CancellationReason;
            }
            return res;
        },
        save_cancellation_order_to_server: function() {
            var self = this;
            var order_id = this.pos.db.add_order(this.export_as_JSON());
            var order_obj = this.pos.db.get_order(order_id);
            order_obj.data.CancellationReason = this.CancellationReason;
            order_obj.to_invoice = false;

            order_obj.data.is_cancelled = true;
            new Model("pos.order").call('create_from_ui', [[order_obj]]).then(function (resultat) {
                if (resultat) {
                    var lines = self.get_orderlines();
                    _.each(lines, function(line) {
                        self.pos.gui.screen_instances.products.order_widget.set_value('remove');
                    });
                    self.printChanges();
                    self.saveChanges();
                    self.pos.delete_current_order();
                }
            });
        },
    });

    var ReasonCancellationScreenWidget = screens.ScreenWidget.extend({
        template: 'ReasonCancellationScreenWidget',
        events: {
            'click .reason-line': function (event) {
                var line = $('.reason-line#'+parseInt(event.currentTarget.id));
                this.line_select(line, parseInt(event.currentTarget.id));
            },
            'click .reason-back': function () {
                this.gui.back();
            },
            'click .reason-next': function () {
                this.save_changes();
                this.gui.back();
            },
        },
        init: function(parent, options){
            this._super(parent, options);
            this.reason_cache = new screens.DomCache();
            var self = this;
        },
        auto_back: true,
        show: function(){
            var self = this;
            this._super();
            this.show_reason_button = false;
            var cancellation_reasons = self.pos.cancelled_reason;
            this.render_list(cancellation_reasons);
        },
        render_list: function(reasons){
            var contents = this.$el[0].querySelector('.reason-list-contents');
            contents.innerHTML = "";
            for(var i = 0, len = Math.min(reasons.length,1000); i < len; i++){
                var reason = reasons[i];
                var cancellation_reason = this.reason_cache.get_node(reason.id);
                if(!cancellation_reason){
                    var cancellation_reason_html = QWeb.render('CancellationReason',{widget: this, reason:reasons[i]});
                    cancellation_reason = document.createElement('tbody');
                    cancellation_reason.innerHTML = cancellation_reason_html;
                    cancellation_reason = cancellation_reason.childNodes[1];
                    this.reason_cache.cache_node(reason.id,cancellation_reason);
                }
                cancellation_reason.classList.remove('highlight');
                contents.appendChild(cancellation_reason);
            }
        },
        save_changes: function(){
            var self = this;
            var order = this.pos.get_order();
            var type = order.CancellationReasonType;
            order.CancellationReason = $('.reason-line#'+this.old_id + ' td').text();
            if (type === 'product') {
                self.gui.screen_instances.products.order_widget.set_value('remove');
                order.was_removed_product = true;
                order.printChanges();
                order.saveChanges();
            } else {
                order.save_cancellation_order_to_server();
            }
        },
        toggle_save_button: function(){
            var $button = this.$('.button.next');
            if (this.show_reason_button) {
                $button.removeClass('oe_hidden');
                $button.text(_t('Apply'));
            } else {
                $button.addClass('oe_hidden');
                return;
            }
        },
        line_select: function(line,id){
            if (this.old_id !== id) {
                this.show_reason_button = true;
                this.old_id = id;
            }
            if ( line.hasClass('highlight') ){
                line.removeClass('highlight');
                this.show_reason_button = false;
            }else{
                this.$('.reason-list .highlight').removeClass('highlight');
                line.addClass('highlight');
                this.show_reason_button = true;
            }

            this.toggle_save_button();
        },
    });
    gui.define_screen({name:'reason_screen', widget: ReasonCancellationScreenWidget});
});
