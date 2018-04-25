/* Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history', function (require) {
    "use strict";
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var PosDB = require('point_of_sale.DB');
    var core = require('web.core');
    var QWeb = core.qweb;
    var Model = require('web.Model');
    var longpolling = require('pos_longpolling');
    var PopupWidget = require('point_of_sale.popups')

    var OrdersHistoryButton = screens.OrdersHistoryButton = {};
    var OrdersHistoryScreenWidget = screens.OrdersHistoryScreenWidget = {};
    var OrderLinesHistoryScreenWidget = screens.OrderLinesHistoryScreenWidget = {};

    var _super_pos_model = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function () {
            _super_pos_model.initialize.apply(this, arguments);
            this.bus.add_channel_callback("pos_orders_history", this.on_orders_history_updates, this);
            this.subscribers = [];
        },

        add_subscriber: function (subscriber) {
            this.subscribers.push(subscriber);
        },

        on_orders_history_updates: function(message) {
            var self = this;
            message.updated_orders.forEach(function (id) {
                self.get_order_history(id).done(function(order) {
                    self.update_orders_history(order);
                });
                self.get_order_history_lines_by_order_id(id).done(function (lines) {
                    self.update_orders_history_lines(lines);
                });
            });
        },

        get_order_history: function (id) {
            return new Model('pos.order').call('search_read', [[['id', '=', id]]]);
        },

        get_order_history_lines_by_order_id: function (id) {
            return new Model('pos.order.line').call('search_read', [[['order_id', '=', id]]]);
        },

        update_orders_history: function (orders) {
            var self = this,
                all_orders,
                orders_to_update = [];
            if (!(orders instanceof Array)) {
                orders = [orders];
            }
            if (this.db.pos_orders_history.length !== 0) {
                    _.each(orders, function (updated_order) {
                    var i,
                        max = self.db.pos_orders_history.length;
                    for (i = 0; i < max; i++) {
                        if (updated_order.id === self.db.pos_orders_history[i].id) {
                            self.db.pos_orders_history.splice(i, 1);
                            delete self.db.orders_history_by_id[updated_order.id];
                            orders_to_update.push(updated_order.id);
                            break;
                        }
                    }
                });
            }

            all_orders = this.db.pos_orders_history.concat(orders);
            this.db.pos_orders_history = all_orders;
            this.db.sorted_orders_history(all_orders);
            all_orders.forEach(function (current_order) {
                self.db.orders_history_by_id[current_order.id] = current_order;
            });
            this.publish_db_updates(orders_to_update);
        },

        publish_db_updates: function (ids) {
            _.each(this.subscribers, function (subscriber) {
                var callback = subscriber.callback,
                    context = subscriber.context;
                callback.call(context, 'update', ids);
            });
        },

        update_orders_history_lines: function(lines) {
            var self = this;
            var all_lines = this.db.pos_orders_history_lines.concat(lines);
            this.db.pos_orders_history_lines = all_lines;
            all_lines.forEach(function (line) {
                self.db.line_by_id[line.id] = line;
            });
        },
        get_date: function() {
            var currentdate = new Date();
            var year = currentdate.getFullYear();
            var month = (currentdate.getMonth()+1);
            var day = currentdate.getDate();
            if (Math.floor(month / 10) === 0) {
                month = '0' + month;
            }
            if (Math.floor(day / 10) === 0) {
                day = '0' + day;
            }
            return year + "-" + month + "-" + day;
        },
    });

    models.load_models({
        model: 'pos.order',
        fields: [],
        domain: function(self){
            var domain = [['state','=','paid']];
            if (self.config.show_cancelled_orders) {
                domain.push(['state','=','cancel']);
            }
            if (domain.length === 2) {
                domain.unshift('|');
            } else if (domain.length === 3) {
                domain.unshift('|','|');
            }
            return domain;
        },

        loaded: function (self, orders) {
            var order_ids = [];
            if (self.config.current_day_orders_only) {
                orders = orders.filter(function(order) {
                    return self.get_date() === order.date_order.split(" ")[0];
                });
            }
            self.update_orders_history(orders);

            order_ids = _.pluck(orders, 'id');
            new Model('pos.order.line').call('search_read', [[['order_id', 'in', order_ids]]])
            .then(function (lines) {
                self.update_orders_history_lines(lines);
            });
        },
    });

    PosDB.include({
        init: function (options) {
            this.order_search_string = "";
            this.sorted_orders = [];
            this.orders_history_by_id = {};
            this.line_by_id = {};
            this.pos_orders_history = [];
            this.pos_orders_history_lines = [];
            this._super.apply(this, arguments);
        },

        search_order: function(query){
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
                query = query.replace(' ','.+');
                var re = RegExp("([0-9]+):.*?"+query,"gi");
            }catch(e){
                return [];
            }
            var results = [];
            for(var i = 0; i < this.limit; i++){
                var r = re.exec(this.order_search_string);
                if(r) {
                    var id = Number(r[1]);
                    var exist_order = this.orders_history_by_id[id];
                    if (exist_order) {
                        results.push(exist_order);
                    }
                }else{
                    break;
                }
            }
            return results;
        },

        _order_search_string: function(order){
            var str = order.name;
            if(order.pos_reference){
                str += '|' + order.pos_reference;
            }
            if(order.partner_id){
                str += '|' + order.partner_id[1];
            }
            if(order.date_order){
                str += '|' + order.date_order;
            }
            if(order.user_id){
                str += '|' + order.user_id[1];
            }
            if(order.amount_total){
                str += '|' + order.amount_total;
            }
            if(order.state){
                str += '|' + order.state;
            }
            str = String(order.id) + ':' + str.replace(':','') + '\n';
            return str;
        },

        get_sorted_orders_history: function (count) {
            return this.sorted_orders.slice(0, count);
        },

        sorted_orders_history: function (orders) {
            var self = this;
            var orders_history = orders;
            function compareNumeric(order1, order2) {
                return order2.id - order1.id;
            }
            this.sorted_orders = orders_history.sort(compareNumeric);
            this.order_search_string = "";
            this.sorted_orders.forEach(function (order) {
                self.order_search_string += self._order_search_string(order);
            });
        },
    });

    OrdersHistoryButton = screens.ActionButtonWidget.extend({
        template: 'OrdersHistoryButton',
        button_click: function () {
            if (this.pos.db.pos_orders_history.length) {
                this.gui.show_screen('orders_history_screen');
            }
        },
    });

    screens.define_action_button({
        'name': 'orders_history_button',
        'widget': OrdersHistoryButton,
        'condition': function () {
            return this.pos.config.orders_history;
        },
    });

    var OrdersHistoryScreenWidget = screens.ScreenWidget.extend({
        template: 'OrdersHistoryScreenWidget',

        init: function(parent, options){
            this._super(parent, options);
            this.orders_history_cache = new screens.DomCache();
            this.filters = [];
            this.selected_order = false;
            this.subscribe();

        },
        auto_back: true,

        subscribe: function () {
            var subscriber = {
                context: this,
                callback: this.recieve_updates
            };
            this.pos.add_subscriber(subscriber);
        },

        show: function(){
            var self = this;
            this._super();
            this.clear_list_widget();

            this.$('.back').click(function () {
                self.gui.show_screen('products');
            });

            var orders = this.pos.db.get_sorted_orders_history(1000);
            this.render_list(orders);

            this.$('.filters .user-filter').click(function (e) {
                e.stopImmediatePropagation();
                self.change_filter('user', $(this));
            });

            this.$('.filters .pos-filter').click(function (e) {
                e.stopImmediatePropagation();
                self.change_filter('pos', $(this));
            });

            this.$('.filters .table-filter').click(function (e) {
                e.stopImmediatePropagation();
                self.change_filter('table', $(this));
            });

            this.$('.order-list-contents').delegate('.order-line td', 'click', function (event) {
                event.stopImmediatePropagation();
                if ($(this).hasClass('actions')) {
                    return false;
                }
                var parent = $(this).parent()
                self.line_select(event, parent, parseInt(parent.data('id')));
            });

            var search_timeout = null;
            if(this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard){
                this.chrome.widget.keyboard.connect(this.$('.searchbox input'));
            }
            this.$('.searchbox input').on('keypress',function (event) {
                clearTimeout(search_timeout);

                var query = this.value;

                search_timeout = setTimeout(function () {
                    self.perform_search(query,event.which === 13);
                },70);
            });

            this.$('.searchbox .search-clear').click(function () {
                self.clear_search();
            });
        },

        clear_list_widget: function () {
            this.$(".order-line").removeClass('active');
            this.$(".order-line").removeClass('highlight');
            this.$(".line-element-container").addClass('line-element-hidden');
        },

        change_filter: function(filter_name, filter) {
            if (filter.hasClass("active")){
                filter.removeClass("active");
                this.remove_active_filter(filter_name);
            } else {
                filter.addClass("active");
                this.set_active_filter(filter_name);
            }
            this.apply_filters();
        },

        remove_active_filter: function(name) {
            this.filters.splice(this.filters.indexOf(name), 1);
        },

        set_active_filter: function(name) {
            this.filters.push(name);
        },

        apply_filters: function() {
            var self = this;
            var orders = this.pos.db.get_sorted_orders_history(1000);
            this.filters.forEach(function (filter) {
                orders = self.get_orders_by_filter(filter, orders);
            });
            this.render_list(orders);
        },

        get_orders_by_filter: function(filter, orders) {
            var self = this;
            if (filter === "user") {
                var user_id = this.pos.cashier ? this.pos.cashier.id : this.pos.user.id;
                if (this.pos.cashier && this.pos.cashier.id) {
                    user_id = this.pos.cashier.id;
                }
                return orders.filter(function(order) {
                    return order.user_id[0] === user_id;
                });
            } else if (filter === "pos") {
                return orders.filter(function(order) {
                    return order.config_id[0] === self.pos.config.id;
                });
            } else if (filter === "table") {
                if (this.pos.table) {
                    return orders.filter(function(order) {
                        return order.table_id[0] === self.pos.table.id;
                    });
                }
                return orders.filter(function(order) {
                    return !order.table_id;
                });
            }
        },

        render_list: function(orders) {
            var self = this,
                contents = this.$el[0].querySelector('.order-list-contents');

            contents.innerHTML = "";

            for (var i = 0, len = Math.min(orders.length,1000); i < len; i++){
                var order = orders[i],
                    orderline = false;
                    orderline = this.orders_history_cache.get_node(order.id),
                    lines_table = this.orders_history_cache.get_node(order.id + '_table');

                if ((!orderline) || (!lines_table)) {
                    var orderline_html = QWeb.render('OrderHistory',{widget: this, order:orders[i]});
                    orderline = document.createElement('tbody');

                    var lines_table = document.createElement('tr');
                    if (orders[i].lines) {
                        var $td = document.createElement('td');
                        $td.setAttribute("colspan", 8);
                    }

                    lines_table.classList.add('line-element-hidden');
                    lines_table.classList.add('line-element-container');

                    var line_data = _.map(orders[i].lines, function (id) {
                        var line = self.pos.db.line_by_id[id];
                        line.image = self.get_product_image_url(line.product_id[0]);
                        return line;
                    });

                    var $table = this.render_lines_table(line_data);

                    $td.appendChild($table);
                    lines_table.appendChild($td);

                    orderline.innerHTML = orderline_html;
                    orderline = orderline.childNodes[1];

                    this.orders_history_cache.cache_node(order.id, orderline);
                    this.orders_history_cache.cache_node(order.id + '_table', lines_table);
                }
                contents.appendChild(orderline);
                contents.appendChild(lines_table);
            }
        },

        render_lines_table: function (data_lines) {
            var $table = document.createElement('table'),
                $header = this.render_header(),
                $tableData = this.render_product_lines(data_lines);

            $table.classList.add('lines-table');

            $table.appendChild($header);
            $table.appendChild($tableData);
            return $table;

        },

        render_header: function () {
            var $header = document.createElement('thead');
            $header.innerHTML = QWeb.render('LinesHeader');
            return $header;
        },

        render_product_lines: function (data_lines) {
            var $body = document.createElement('tbody'),
            lines = '',
            line_html = '';
            for(var i = 0, max = data_lines.length; i < max; i++) {
                line_html = QWeb.render('LineHistory', {widget: this, line:data_lines[i]});
                lines += line_html;
            }
            $body.innerHTML = lines;
            return $body;
        },

        clear_search: function(){
            var orders = this.pos.db.pos_orders_history;
            this.render_list(orders);
            this.$('.searchbox input')[0].value = '';
            this.$('.searchbox input').focus();
        },

        line_select: function(event, $line, id) {
            this.$(".order-line").not($line).removeClass('active');
            this.$(".order-line").not($line).removeClass('highlight');
            this.$(".line-element-container").addClass('line-element-hidden');
            if ($line.hasClass('active')) {
                $line.removeClass('active');
                $line.removeClass('highlight');

                this.hide_order_details($line)
                this.selected_order = false;
            } else {
                $line.addClass('active');
                $line.addClass('highlight');
                this.show_order_details($line);
                var y = event.pageY - $line.parent().offset().top;
                this.selected_order = this.pos.db.orders_history_by_id[id];
            }
        },


        hide_order_details: function ($line) {
            $line.next().addClass('line-element-hidden');
        },

        show_order_details: function ($line) {
            $line.next().removeClass('line-element-hidden');
        },

        recieve_updates: function (action, ids) {
            switch (action) {
                case 'update':
                    this.update_list_items(ids);
                    break;
                default:
                    break;
            }
        },

        update_list_items: function (ids) {
            var self = this;
            _.each(ids, function (id) {
                var $el = $('.order-list').find('[data-id=' + id + ']'),
                    data = self.pos.db.orders_history_by_id[id],
                    new_el_html,
                    selected = false,
                    orderline;
                if (($el.length === 0) || (!data)) {
                    return;
                }
                new_el_html = QWeb.render('OrderHistory', {widget: self, order:data});
                if ($el.hasClass('active')) {
                    selected = true;
                }
                orderline = document.createElement('tbody');
                orderline.innerHTML = new_el_html;
                orderline = orderline.childNodes[1];
                $el.replaceWith(orderline);
                self.orders_history_cache.clear_node(id);
                self.orders_history_cache.cache_node(id, orderline);
                if (selected) {
                    orderline.classList.add('active', 'highlight');
                }
            });

        },

        perform_search: function(query, associate_result){
            var orders = false;
            if (query) {
                orders = this.pos.db.search_order(query);
                this.render_list(orders);
            } else {
                orders = this.pos.db.pos_orders_history;
                this.render_list(orders);
            }
        },

        get_product_image_url: function(product_id){
            return window.location.origin + '/web/image?model=product.product&field=image_small&id='+product_id;
        },
    });

    gui.define_screen({name:'orders_history_screen', widget: OrdersHistoryScreenWidget});

    return {
        OrdersHistoryScreenWidget: OrdersHistoryScreenWidget,
    };
});
