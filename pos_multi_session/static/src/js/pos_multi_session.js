odoo.define('pos_multi_session', function(require){
    var exports = {};

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');
    var chrome = require('point_of_sale.chrome');

    var _t = core._t;

    // prevent bus to be started by chat_manager.js
    bus.bus.activated = true; // fake value to ignore start_polling call

    screens.OrderWidget.include({
        rerender_orderline: function(order_line){
            if (order_line.node && order_line.node.parentNode) {
                return this._super(order_line);
            }
        },
        remove_orderline: function(order_line){
            if (order_line.node.parentNode) {
                return this._super(order_line);
            }
            if (this.pos.get_order() && this.pos.get_order().get_orderlines().length === 0){
                return this._super(order_line);
            }
        }
    });
    screens.ReceiptScreenWidget.extend({
        finish_order: function() {
            if (!this._locked) {
                this.pos.get('selectedOrder').destroy({'reason': 'finishOrder'});
            }
        },
        /* since saas-6:
        click_next: function() {
            this.pos.get('selectedOrder').destroy({'reason': 'finishOrder'});
        }
         */
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.multi_session = false;
            this.ms_syncing_in_progress = false;
            this.get('orders').bind('remove', function(order, collection, options){
                if (!self.multi_session.client_online) {
                    if (order.order_on_server ) {
                        var warning_message = _t("No connection to the server. You can only create new orders. It is forbidden to modify existing orders.");
                        self.multi_session.warning(warning_message);
                        return false;
                    }
                }
                order.ms_remove_order();
            });
            this.ready.then(function () {
                self.init_multi_session();
            });

        },
        init_multi_session: function(){
            if (this.config.multi_session_id){
                this.multi_session = new exports.MultiSession(this);
                this.multi_session.start();
                this.multi_session.request_sync_all();
            }
        },
        ms_my_info: function(){
            var user = this.cashier || this.user;
            return {
                'user': {
                    'id': user.id,
                    'name': user.name,
                },
                'pos': {
                    'id': this.config.id,
                    'name': this.config.name,
                }
            };
        },
        on_removed_order: function(removed_order,index,reason){
            if (this.multi_session){
                if (reason === 'finishOrder'){
                    if (this.get('orders').size() > 0){
                        return this.set({'selectedOrder' : this.get('orders').at(index) || this.get('orders').first()});
                    }
                    this.add_new_order();
                    this.get('selectedOrder').ms_replace_empty_order = true;
                    return;
                } else if (this.ms_syncing_in_progress){
                    if (this.get('orders').size() === 0) {
                        this.add_new_order();
                    } else {
                        return this.set({'selectedOrder': this.get('orders').at(index) || this.get('orders').first()});
                    }
                    return;
                }
            }
            var self = this;
            return PosModelSuper.prototype.on_removed_order.apply(this, arguments);
        },
        ms_on_update: function(message, sync_all){
            this.ms_syncing_in_progress = true; // don't broadcast updates made from this message
            var error = false;
            var self = this;
            var data = '';
            var action = '';
            try{
                if (this.debug){
                    console.log('MS', this.config.name, 'on_update:', JSON.stringify(message));
                }
                action = message.action;
                data = message.data || {};
                var order = false;
                if (data.uid){
                    order = this.get('orders').find(function(order){
                        return order.uid == data.uid;
                    });
                }
                if (sync_all) {
                    this.message_ID = data.message_ID;
                    this.ms_do_update(order, data);
                } else {
                    if (self.message_ID + 1 != data.message_ID)
                        self.multi_session.request_sync_all();
                    else
                        self.message_ID = data.message_ID;
                    if (order && action == 'remove_order') {
                        order.destroy({'reason': 'abandon'});
                    }
                    else if (action == 'update_order')
                        this.ms_do_update(order, data);
                }
            }catch(err){
                error = err;
                //console.error(err);
            }
            this.ms_syncing_in_progress = false;
            if (error){
                throw(error);
            }
        },
        ms_on_add_order: function (current_order) {
            if (!current_order) {
                return;
            }
            is_frozen = !current_order.ms_replace_empty_order;
            if (this.config.multi_session_replace_empty_order && current_order.new_order && !is_frozen) {
                current_order.destroy({'reason': 'abandon'});
            } else if (is_frozen || !current_order.new_order || !this.config.multi_session_deactivate_empty_order) {
                // keep current_order active
                this.set('selectedOrder', current_order);
            }
        },
        ms_create_order: function(options){
            options = _.extend({pos: this}, options || {});
            return new models.Order({}, options);
        },
        ms_do_update: function(order, data){
            var pos = this;
            this.pos_session.order_ID = data.sequence_number;
            if (!order){
                var create_new_order = pos.config.multi_session_accept_incoming_orders || !(data.ms_info && data.ms_info.created.user.id != pos.ms_my_info().user.id);
                if (!create_new_order){
                    return;
                }
                json = {
                    sequence_number: data.sequence_number,
                    uid: data.uid,
                    pos_session_id: this.pos_session.id,
                    statement_ids: false,
                    lines: false,
                    multiprint_resume: data.multiprint_resume,
                    new_order: false,
                    order_on_server: true,
                };
                order = this.ms_create_order({ms_info:data.ms_info, revision_ID:data.revision_ID, data:data, json:json});
                var current_order = this.get_order();
                this.get('orders').add(order);
                this.ms_on_add_order(current_order);
            } else {
                order.ms_info = data.ms_info;
                order.revision_ID = data.revision_ID;
            }
            var not_found = order.orderlines.map(function(r){
                return r.uid;
            });
            if(data.partner_id !== false)
            {
                var client = order.pos.db.get_partner_by_id(data.partner_id);
                if(!client)
                {

                    $.when(this.load_new_partners_by_id(data.partner_id))
                                    .then(function(client){client = order.pos.db.get_partner_by_id(data.partner_id);
                             order.set_client(client);},function(){});
                }
                order.set_client(client);
            }
            else
            {
                order.set_client(null);
            }

            _.each(data.lines, function(dline){
                dline = dline[2];
                var line = order.orderlines.find(function(r){
                    return dline.uid == r.uid;
                });
                not_found = _.without(not_found, dline.uid);
                var product = pos.db.get_product_by_id(dline.product_id);
                if (!line){
                    line = new models.Orderline({}, {pos: pos, order: order, product: product});
                    line.uid = dline.uid;
                }
                line.ms_info = dline.ms_info || {};
                if(dline.qty !== undefined){
                    line.set_quantity(dline.qty);
                }
                if(dline.price_unit !== undefined){
                    line.set_unit_price(dline.price_unit);
                }
                if(dline.discount !== undefined){
                    line.set_discount(dline.discount);
                }
                if(dline.mp_dirty !== undefined){
                    line.set_dirty(dline.mp_dirty);
                }
                if(dline.mp_skip !== undefined){
                    line.set_skip(dline.mp_skip);
                }
                if(dline.note !== undefined){
                    line.set_note(dline.note);
                }
                order.orderlines.add(line);
            });

            _.each(not_found, function(uid){
                var line = order.orderlines.find(function(r){
                               return uid == r.uid;
                           });
                order.orderlines.remove(line);
            });
            order.order_on_server = true;
            order.new_order = false;
        },
        load_new_partners_by_id: function(partner_id){
        var self = this;
        var def  = new $.Deferred();
        var client;
        var fields = _.find(this.models,function(model){ return model.model === 'res.partner'; }).fields;
        new Model('res.partner')
            .query(fields)
            .filter([['id','=',partner_id]])
            .all({'timeout':3000, 'shadow': true})
            .then(function(partners){
                if (self.db.add_partners(partners)) {   // check if the partners we got were real updates
                    def.resolve();
                } else {
                    def.reject();
                }
            }, function(err,event){ event.preventDefault(); def.reject(); });
        return def;
    },
    });

    chrome.OrderSelectorWidget.include({
        init: function(parent,options) {
            this._super(parent,options);
            this.pos.get('orders').bind('change:update_new_order', this.renderElement,this );
        },
        destroy: function(){
            this.pos.get('orders').unbind('change:update_new_order', this.renderElement, this);
            this._super();
        },
    });

    var is_first_order = true;
    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        initialize: function(attributes, options){
            var self = this;
            options = options || {};

            if (!options.json || !('new_order' in options.json)) {
                this.new_order = true;
            }

            OrderSuper.prototype.initialize.apply(this, arguments);
            this.ms_info = {};
            this.revision_ID = options.revision_ID || 1;
            if (!_.isEmpty(options.ms_info)){
                this.ms_info = options.ms_info;
            } else if (this.pos.multi_session){
                this.ms_info.created = this.pos.ms_my_info();
            }

            this.ms_replace_empty_order = is_first_order;
            is_first_order = false;
            this.bind('change:sync', function(){
                self.ms_update();
            });
        },
        remove_orderline: function(line){
            OrderSuper.prototype.remove_orderline.apply(this, arguments);
            line.order.trigger('change:sync');
        },
        add_product: function(){
            this.trigger('change:sync');
            OrderSuper.prototype.add_product.apply(this, arguments);
        },
        set_client: function(client){
             /*  trigger event before calling add_product,
                 because event handler ms_update updates some values of the order (e.g. new_name),
                 while add_product saves order to localStorage.
                 So, calling add_product first would lead to saving obsolete values to localStorage.
                 From the other side, ms_update work asynchronously (via setTimeout) and will get updates from add_product method
             */
            this.trigger('change:sync');
            OrderSuper.prototype.set_client.apply(this,arguments);
        },
        ms_check: function(){
            if (! this.pos.multi_session )
                return;
            if (this.pos.ms_syncing_in_progress)
                return;
            return true;
        },
        ms_update: function(){
            var self = this;
            if (this.new_order) {
                this.new_order = false;
                this.pos.pos_session.order_ID = this.pos.pos_session.order_ID + 1;
                this.sequence_number = this.pos.pos_session.order_ID;
                this.trigger('change:update_new_order');
            }
            if (!this.ms_check())
                return;
            if (this.ms_update_timeout)
                // restart timeout
                clearTimeout(this.ms_update_timeout);
            this.ms_update_timeout = setTimeout(
                function(){
                    self.ms_update_timeout = false;
                    self.do_ms_update();
                }, 1000);
        },
        ms_remove_order: function(){
            if (!this.ms_check())
                return;
            this.do_ms_remove_order();
        },
        do_ms_remove_order: function(){
            this.pos.multi_session.remove_order({'uid': this.uid, 'revision_ID': this.revision_ID});
        },
        export_as_JSON: function(){
            var data = OrderSuper.prototype.export_as_JSON.apply(this, arguments);
            data.ms_info = this.ms_info;
            data.revision_ID = this.revision_ID;
            data.new_order = this.new_order;
            data.order_on_server = this.order_on_server;
            return data;
        },
        init_from_JSON: function(json) {
            this.new_order = json.new_order;
            this.order_on_server = json.order_on_server;
            OrderSuper.prototype.init_from_JSON.call(this, json);
        },
        do_ms_update: function(){
            var self = this;
            var data = this.export_as_JSON();
            this.just_printed = false;
            this.pos.multi_session.update(data).fail(function(error){
                if (error == 'offline') {
                    if (self.order_on_server) {
                        self.order_on_server = true;
                    } else {
                        self.order_on_server = false;
                    }
                }
            }).done(function(res){
                self.order_on_server = true;
                if (res) {
                    var server_revision_ID = res.revision_ID;
                    var order_ID = res.order_ID;
                    if (self.sequence_number != order_ID) {
                        self.sequence_number = order_ID;
                        // sequence number replace
                        self.pos.pos_session.order_ID = order_ID;
                        // rerender order
                        self.trigger('change');
                    }
                    if (server_revision_ID && server_revision_ID > self.revision_ID) {
                        self.revision_ID = server_revision_ID;
                    }
                }
            });
        }
    });
    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            this.ms_info = {};
            if (!this.order)
                // ignore new orderline from splitbill tool
                return;
            if (this.order.ms_check()){
                this.ms_info.created = this.order.pos.ms_my_info();
            }
            this.bind('change', function(line){
                if(this.order.just_printed){
                    line.order.trigger('change:sync');
                    return;
                }
                if (self.order.ms_check() && !line.ms_changing_selected){
                    line.ms_info.changed = line.order.pos.ms_my_info();
                    line.order.ms_info.changed = line.order.pos.ms_my_info();
                    var order_lines = line.order.orderlines;
                    order_lines.trigger('change', order_lines); // to rerender line
                    line.order.trigger('change:sync');
                }
            });
            this.uid = this.order.generate_unique_id() + '-' + this.id;
        },
        set_selected: function(){
            this.ms_changing_selected = true;
            OrderlineSuper.prototype.set_selected.apply(this, arguments);
            this.ms_changing_selected = false;
        },
        export_as_JSON: function(){
            var data = OrderlineSuper.prototype.export_as_JSON.apply(this, arguments);
            data.uid = this.uid;
            data.ms_info = this.ms_info;
            return data;
        }
    });

    exports.MultiSession = Backbone.Model.extend({
        initialize: function(pos){
            this.pos = pos;
            this.show_warning_message = true;
            this.client_online = true;
            this.order_ID = null;
        },
        start: function(){
            var self = this;

            this.bus = bus.bus;
            this.bus.last = this.pos.db.load('bus_last', 0);
            this.bus.on("notification", this, this.on_notification);
            this.bus.stop_polling();
            this.bus.start_polling();

        },
        request_sync_all: function(){
            var data = {};
            this.send({'action': 'sync_all', data: data});
        },
        remove_order: function(data){
            this.send({action: 'remove_order', data: data});
        },
        update: function(data){
            return this.send({action: 'update_order', data: data});
        },
        send: function(message){
            if (this.pos.debug){
                console.log('MS', this.pos.config.name, 'send:', JSON.stringify(message));
            }
            var self = this;
            var connection_status = new $.Deferred();
            message.data.pos_id = this.pos.config.id;
            var send_it = function () {
                return openerp.session.rpc("/pos_multi_session/update", {
                    multi_session_id: self.pos.config.multi_session_id[0],
                    message: message
                });
            };
            send_it().fail(function (error, e) {
                if(error.message === 'XmlHttpRequestError ') {
                    self.client_online = false;
                    e.preventDefault();
                    connection_status.reject('offline');
                    if (self.show_warning_message) {
                        var warning_message = _t("No connection to the server. You can only create new orders. It is forbidden to modify existing orders.");
                        self.warning(warning_message);
                        self.start_offline_sync_timer();
                        self.show_warning_message = false;
                    }
                } else {
                    self.request_sync_all();
                }
            }).done(function(res){
                var server_orders_uid = [];
                self.client_online = true;
                if (res.action == "update_revision_ID") {
                    connection_status.resolve(res);
                }
                connection_status.resolve();
                if (res.action == "revision_error") {
                    var warning_message = _t('There is a conflict during synchronization, try your action again');
                    self.warning(warning_message);
                    self.request_sync_all();
                }
                if (res.action == 'sync_all') {
                    res.orders.forEach(function (item) {
                        self.pos.ms_on_update(item, true);
                        server_orders_uid.push(item.data.uid);
                    });
                    self.pos.pos_session.order_ID = res.order_ID;
                    self.pos.pos_session.sequence_number = res.order_ID;
                    self.destroy_removed_orders(server_orders_uid);
                }
                if (self.offline_sync_all_timer) {
                    clearInterval(self.offline_sync_all_timer);
                    self.offline_sync_all_timer = false;
                }
                self.show_warning_message = true;
            });
            return connection_status;
        },
        destroy_removed_orders: function(server_orders_uid) {
            var self = this;
            // find all client orders whose order_on_server is True
            var orders = self.pos.get('orders').filter(
                function(r){
                    return (r.order_on_server === true);
                }
            );
            /* if found by the order from the client is not on the
            list server orders then is means the order was deleted */
            orders.forEach(function(item) {
                var remove_order = server_orders_uid.indexOf(item.uid);
                if (remove_order === -1) {
                    var order = self.pos.get('orders').find(function (order) {
                        return order.uid == item.uid;
                    });
                    order.destroy({'reason': 'abandon'});
                }
            });
            self.send_offline_orders();
        },
        warning: function(warning_message){
            this.pos.chrome.gui.show_popup('error',{
                'title': _t('Warning'),
                'body': warning_message,
            });
        },
        send_offline_orders: function() {
            var self = this;
            var orders = this.pos.get("orders");
            orders.each(function(item) {
                if (item.order_on_server === false) {
                    item.ms_update();
                }
            });
        },
        start_offline_sync_timer: function(){
            var self = this;
            self.offline_sync_all_timer = setInterval(function(){
                self.request_sync_all();
            }, 5000);
        },
        on_notification: function(notification) {
            var self = this;
            if (typeof notification[0][0] === 'string') {
                notification = [notification];
            }
            for (var i = 0; i < notification.length; i++) {
                var channel = notification[i][0];
                var message = notification[i][1];
                this.on_notification_do(channel, message);
            }
            this.pos.db.save('bus_last', this.bus.last);
        },
        on_notification_do: function (channel, message) {
            if(Array.isArray(channel) && channel[1] === 'pos.multi_session'){
                try{
                    this.pos.ms_on_update(message);
                }catch(err){
                    this.pos.chrome.gui.show_popup('error',{
                        'title': _t('Error'),
                        'body': err,
                    });
                }
            }
        }
    });
    return exports;
});
