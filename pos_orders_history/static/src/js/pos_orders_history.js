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
    var floors = require('pos_restaurant.floors');

    var OrdersHistoryButton = screens.OrdersHistoryButton = {};
    var OrdersHistoryScreenWidget = screens.OrdersHistoryScreenWidget = {};
    var OrderLinesHistoryScreenWidget = screens.OrderLinesHistoryScreenWidget = {};

    var _super_pos_model = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            _super_pos_model.initialize.apply(this, arguments);
            this.add_channel("pos_orders_history", this.on_orders_history_updates, this);
        },
        on_orders_history_updates: function(message) {
            var self = this;
            message.updated_orders.forEach(function(id) {
                self.get_order_history(id).done(function(order) {
                    self.update_orders_history(order);
                });
                self.get_order_history_lines_by_order_id(id).done(function(lines) {
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
        update_orders_history: function(orders) {
            if (!(orders instanceof Array)) {
                orders = [orders];
            }
            var self = this;
            var all_orders = this.db.pos_orders_history.concat(orders);
            this.db.pos_orders_history = all_orders;
            this.db.sorted_orders_history(all_orders);
            all_orders.forEach(function(current_order){
                self.db.orders_history_by_id[current_order.id] = current_order;
            });
        },
        update_orders_history_lines: function(lines) {
            var self = this;
            var all_lines = this.db.pos_orders_history_lines.concat(lines);
            this.db.pos_orders_history_lines = all_lines;
            all_lines.forEach(function(line){
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
            if (self.config.show_posted_orders) {
                domain.push(['state','=','done']);
            }
            if (domain.length === 2) {
                domain.unshift('|');
            } else if (domain.length === 3) {
                domain.unshift('|','|');
            }
            console.log("domain", domain);
            return domain;
        },
        loaded: function(self, orders) {
            if (self.config.current_day_orders_only) {
                console.log("orders", orders);
                orders = orders.filter(function(order) {
                    return self.get_date() === order.date_order.split(" ")[0];
                });
            }
            self.update_orders_history(orders);
        },
    });

    // TODO: don't load all lines
    models.load_models({
        model: 'pos.order.line',
        fields: [],
        loaded: function(self, lines) {
            self.update_orders_history_lines(lines);
        },
    });

    PosDB.include({
        init: function(options){
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
        get_sorted_orders_history: function(count) {
            return this.sorted_orders.slice(0, count);
        },
        sorted_orders_history: function(orders) {
            var self = this;
            var orders_history = orders;
            function compareNumeric(order1, order2) {
                return order2.id - order1.id;
            }
            this.sorted_orders = orders_history.sort(compareNumeric);
            this.order_search_string = "";
            this.sorted_orders.forEach(function(order){
                self.order_search_string += self._order_search_string(order);
            });
        },
    });

    OrdersHistoryButton = screens.ActionButtonWidget.extend({
        template: 'OrdersHistoryButton',
        button_click: function(){
            if (this.pos.db.pos_orders_history.length) {
                this.gui.show_screen('orders_history_screen');
            }
        },
    });

    screens.define_action_button({
        'name': 'orders_history_button',
        'widget': OrdersHistoryButton,
        'condition': function(){
            return this.pos.config.orders_history;
        },
    });

    OrdersHistoryScreenWidget = screens.ScreenWidget.extend({
        template: 'OrdersHistoryScreenWidget',

        init: function(parent, options){
            this._super(parent, options);
            this.orders_history_cache = new screens.DomCache();
            this.filters = [];
        },
        auto_back: true,

        show: function(){
            var self = this;
            this._super();
            this.$('.back').click(function(){
                self.gui.show_screen('products');
            });

            var orders = this.pos.db.get_sorted_orders_history(1000);
            this.render_list(orders);

            this.$('.filters .user-filter').click(function(e){
                self.change_filter('user', $(this));
            });

            this.$('.filters .pos-filter').click(function(){
                self.change_filter('pos', $(this));
            });

            this.$('.filters .table-filter').click(function(){
                self.change_filter('table', $(this));
            });

            this.$('.order-list-contents').delegate('.details','click',function(event){
                self.line_select(event,$(this),parseInt($(this).data('id')));
            });
            var search_timeout = null;
            if(this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard){
                this.chrome.widget.keyboard.connect(this.$('.searchbox input'));
            }
            this.$('.searchbox input').on('keypress',function(event){
                clearTimeout(search_timeout);

                var query = this.value;

                search_timeout = setTimeout(function(){
                    self.perform_search(query,event.which === 13);
                },70);
            });

            this.$('.searchbox .search-clear').click(function(){
                self.clear_search();
            });
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
            this.filters.forEach(function(filter) {
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
            var contents = this.$el[0].querySelector('.order-list-contents');
            contents.innerHTML = "";

            for(var i = 0, len = Math.min(orders.length,1000); i < len; i++){
                var order = orders[i];
                var orderline = this.orders_history_cache.get_node(order.id);
                if(!orderline){
                    var orderline_html = QWeb.render('OrderHistory',{widget: this, order:orders[i]});
                    orderline = document.createElement('tbody');
                    orderline.innerHTML = orderline_html;
                    orderline = orderline.childNodes[1];
                    this.orders_history_cache.cache_node(order.id, orderline);
                }
                contents.appendChild(orderline);
            }
        },
        clear_search: function(){
            var orders = this.pos.db.pos_orders_history;
            this.render_list(orders);
            this.$('.searchbox input')[0].value = '';
            this.$('.searchbox input').focus();
        },
        line_select: function(event, $line, id){
            this.$(".order-line .details.active"):not($line).removeClass('active');
//            $line.parents()[1].after("<tr></tr>")
//            see https://stackoverflow.com/questions/3897396/can-a-table-row-expand-and-close
            var order = this.pos.db.orders_history_by_id[id];
            if ($line.hasClass('active') ){
                $line.removeClass('active');
                console.log("click1");
//                this.display_order_details('hide', order);
            } else {
                $line.addClass('active');
                var y = event.pageY - $line.parent().offset().top;
                console.log("click2");
//                this.display_order_details('show', order, y);
            }
        },
        // Shows or hides the order details box :
        // visibility: 'show', 'hide'
        // order:    the order object to show
        // clickpos:   the height of the click on the list (in pixel), used
        //             to maintain consistent scroll.
        display_order_details: function(visibility, order, clickpos) {
            var contents = this.$('.orders-details-contents');
            var parent   = this.$('.order-list').parent();
            var scroll   = parent.scrollTop();
            var height   = contents.height();

            if(visibility === 'show') {
                contents.empty();
                contents.append($(QWeb.render('OrderHistoryDetails',{widget:this,order:order})));

                var new_height   = contents.height();

                if(!this.details_visible){
                    // resize client list to take into account client details
                    parent.height('-=' + new_height);

                    if(clickpos < scroll + new_height + 20 ){
                        parent.scrollTop( clickpos - 20 );
                    }else{
                        parent.scrollTop(parent.scrollTop() + new_height);
                    }
                }else{
                    parent.scrollTop(parent.scrollTop() - height + new_height);
                }
                this.details_visible = true;
            } else if (visibility === 'hide') {
                contents.empty();
                parent.height('100%');
                if( height > scroll ){
                    contents.css({height:height+'px'});
                    contents.animate({height:0},400,function(){
                        contents.css({height:''});
                    });
                }else{
                    parent.scrollTop( parent.scrollTop() - height);
                }
                this.details_visible = false;
            }
        },
        perform_search: function(query, associate_result){
            var orders = false;
            if(query){
                orders = this.pos.db.search_order(query);
                this.render_list(orders);
            }else{
                orders = this.pos.db.pos_orders_history;
                this.render_list(orders);
            }
        },
    });
    gui.define_screen({name:'orders_history_screen', widget: OrdersHistoryScreenWidget});

    OrderLinesHistoryScreenWidget = screens.ScreenWidget.extend({
        template: 'OrderLinesHistoryScreenWidget',

        init: function(parent, options){
            this._super(parent, options);
            this.lines_history_cache = new screens.DomCache();
            this.order_history_details_cache = new screens.DomCache();
        },
        auto_back: true,

        show: function(options){
            console.log("show options", options);
            var self = this;
            this._super();
            this.$('.back').click(function(){
                self.gui.show_screen('orders_history_screen');
            });
            this.order = this.get_order();
            var lines = [];
            this.order.lines.forEach(function(line_id) {
                var orderline = self.pos.db.line_by_id[line_id];
                orderline.image = self.get_product_image_url(orderline.product_id[0]);
                lines.push(self.pos.db.line_by_id[line_id]);
            });
            this.render_list(lines);
            this.render_order_details(this.order);
        },
        render_list: function(lines) {
            var contents = this.$el[0].querySelector('.orderline-list-contents');
            contents.innerHTML = "";

            for(var i = 0, len = Math.min(lines.length,1000); i < len; i++){
                var line = lines[i];
                var orderline = this.lines_history_cache.get_node(line.id);
                if(!orderline){
                    var orderline_html = QWeb.render('LineHistory',{widget: this, line:lines[i]});
                    orderline = document.createElement('tbody');
                    orderline.innerHTML = orderline_html;
                    orderline = orderline.childNodes[1];
                    this.lines_history_cache.cache_node(line.id, orderline);
                }
                contents.appendChild(orderline);
            }
        },
        render_order_details: function(order) {
            var contents = this.$el[0].querySelector('.order-details-content');
            contents.innerHTML = "";
            var order_content = this.order_history_details_cache.get_node(order.id);
            if (!order_content) {
                var order_html = QWeb.render('OrderHistoryDetails',{order:order});
                order_content = document.createElement('div');
                order_content.innerHTML = order_html;
                order_content = order_content.childNodes[1];
                this.order_history_details_cache.cache_node(order.id, order_content);
            }
            contents.appendChild(order_content);
        },
        get_order: function(){
            return this.gui.get_current_screen_param('order');
        },
        get_product_image_url: function(product_id){
            return window.location.origin + '/web/image?model=product.product&field=image_small&id='+product_id;
        },
    });
    gui.define_screen({name:'order_lines_history_screen', widget: OrderLinesHistoryScreenWidget});

    return screens;
});
