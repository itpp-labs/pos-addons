odoo.define('pos_order_merge.merge', function (require) {

    "use strict";

    var gui = require('point_of_sale.gui');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var floors = require('pos_restaurant.floors');

    var QWeb = core.qweb;
    var _t = core._t;

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        order_merge: function () {
            this.order_merge_status = true;
            this.set_table(null);
        },
        // changes the current table.
        set_table: function(table) {
            if (!table) {
                // no table ? go back to the floor plan, see ScreenSelector
                this.set_order(null);
            } else if (this.order_merge_status) {
                var orders = this.get_table_orders(table);
                if (orders.length) {
                    this.merge_table = table;
                    this.gui.show_screen('order_merge');
                } else {
                    this.gui.show_popup('error', {
                        'title': _t('Warning'),
                        'body': _t('Table is Empty'),
                    });
                }
            } else {
                _super_posmodel.set_table.apply(this, arguments);
            }
        },
        // this is called when an order is removed from the order collection.
        on_removed_order: function(removed_order,index,reason){
            if (this.order_merge_status) {
                return;
            }
            _super_posmodel.on_removed_order.apply(this, arguments);
        },
    });

    var OrderMergeScreenWidget = screens.ScreenWidget.extend({
        template: 'OrderMergeScreenWidget',

        previous_screen: 'floors',

        renderElement: function(){
            var self = this;
            this._super();

            var orders = this.pos.get_table_orders(this.pos.merge_table);
            console.log("this.pos.merge_table", this.pos.merge_table);

            for(var i = 0; i < orders.length; i++){
                var order = orders[i];
                if (order.uid !== this.pos.main_order_uid) {
                    var client = order.get('client')
                                 ? order.get('client').name
                                 : false;
                    var orderwidget = $(QWeb.render('OrderMerge', {
                        widget:this,
                        order:order,
                        client: client,
                        selected: false,
                    }));
                    this.$('.merge-orders').append(orderwidget);
                }
            }

            // change the table for merge
            this.$('.change_table').click(function(){
                self.gui.show_screen(self.previous_screen);
            });

            // back to current order
            this.$('.back').click(function(){
                self.pos.order_merge_status = false;
                var current_order = self.get_order_by_uid(self.pos.main_order_uid);
                if (current_order) {
                    self.gui.show_screen("products");
                    self.pos.set_order(current_order);
                }
            });
        },
        order_was_selected: function(uid) {
            var res = _.find(this.mergeorders, function(id){
                return id === uid;
            });
            return res || false;
        },
        orderselect: function($el, uid) {
            var merge = this.order_was_selected(uid);
            var selected = true;
            if (merge) {
                this.mergeorders.splice(this.mergeorders.indexOf(uid), 1);
                selected = false;
            } else {
                this.mergeorders.push(uid);
            }

            var order = this.get_order_by_uid(uid);
            var client = order.get('client')
                         ? order.get('client').name
                         : false;
            $el.replaceWith($(QWeb.render('OrderMerge',{
                widget: this,
                order: order,
                selected: selected,
                client: client,
            })));
            this.change_button();
        },
        show: function(){
            var self = this;
            this._super();
            this.renderElement();

            this.mergeorders = [];

            var $mergemethods = this.$('.mergemethods');
            $mergemethods.children().hide();
            var $merge_buttons = $mergemethods.find('.button');

            this.$('.merge-orders').on('click','.order', function(){
                var uid = $(this).data('uid');
                var $el = $(this);
                self.orderselect($el, uid);
                if (self.mergeorders.length) {
                    $merge_buttons.show();
                } else {
                    $merge_buttons.hide();
                }
            });

            $merge_buttons.click(function(){
                self.merge();
            });
        },
        merge: function() {
            var self = this;
            var main_order = this.get_order_by_uid(this.pos.main_order_uid);

            this.gui.show_screen("products");
            this.pos.set_order(main_order);

            this.mergeorders.forEach(function(uid) {
                var order = self.get_order_by_uid(uid);
                var orderlines = order.get_orderlines();
                if (orderlines && orderlines.length) {
                    orderlines.forEach(function(line){
                        var temp_line = line.export_as_JSON();
                        main_order.add_orderline(new models.Orderline({}, {pos: self.pos, order: main_order, json: temp_line}));
                    });
                }
                if (uid !== self.pos.main_order_uid) {
                    order.destroy({'reason':'abandon'});
                }
            });

            this.pos.order_merge_status = false;
        },
        get_order_by_uid: function(uid) {
            var orders = this.pos.get('orders').models;
            for (var i = 0; i < orders.length; i++) {
                if (orders[i].uid === uid) {
                    return orders[i];
                }
            }
            return false;
        },
        change_button: function() {
            if (this.mergeorders.length) {
                this.$('.mergemethods .button').addClass('highlight');
            } else {
                this.$('.mergemethods .button').removeClass('highlight');
            }
        }
    });

    gui.define_screen({
        'name': 'order_merge',
        'widget': OrderMergeScreenWidget,
        'condition': function(){
            return this.pos.config.iface_order_merge;
        },
    });

    var OrderMergeButton = screens.ActionButtonWidget.extend({
        template: 'OrderMergeButton',
        button_click: function(){
            if (this.pos.get('orders').models.length > 1) {
                // the main order where other orders will be merged
                this.pos.main_order_uid = this.pos.get_order().uid;

                this.pos.order_merge();
            }
        },
    });

    screens.define_action_button({
        'name': 'order_merge',
        'widget': OrderMergeButton,
        'condition': function(){
            return this.pos.config.iface_order_merge;
        },
    });
});
