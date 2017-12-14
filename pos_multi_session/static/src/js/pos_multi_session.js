odoo.define('pos_multi_session', function(require){
    var exports = {};

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');
    var chrome = require('point_of_sale.chrome');
    var longpolling = require('pos_longpolling');
    var Model = require('web.Model');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var gui = require('point_of_sale.gui');
    var framework = require('web.framework');


    var _t = core._t;


    screens.OrderWidget.include({
        renderElement: function(scrollbottom){
            var order = this.pos.get_order();
            if (!order) {
                return;
            }
            if (this.pos.debug) {
                console.log("renderElement of OrderWidget");
            }
            this._super(scrollbottom);
        },
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
    screens.set_fiscal_position_button.include({
        button_click: function() {
            var self = this;
            this._super(event);
            this.gui.current_popup.$(".selection-item").click(function(){
                self.pos.get_order().trigger('change:sync');
            });
        },
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
            var ms_model = {
                model: 'pos.multi_session',
                fields: ['run_ID'],
                domain: function(){
                    return [['id', '=', self.config.multi_session_id[0]]];
                },
                loaded: function(me, current_session){
                    if (self.config.multi_session_id) {
                        self.multi_session_run_ID = current_session[0].run_ID;
                    }
            }};
            this.models.splice(
                this.models.indexOf(_.find(this.models, function(model){
                    return model.model === 'pos.config';
                })) + 1, 0, ms_model);
            PosModelSuper.prototype.initialize.apply(this, arguments);
            if (!this.message_ID) {
                this.message_ID = 0;
            }
            this.multi_session = false;
            this.ms_syncing_in_progress = false;
            if (this.getUrlParameter('stringify-logs') === "1") {
                this.stringify_logs = true;
            }
            this.ready.then(function () {
                if (!self.config.multi_session_id){
                    return;
                }
                self.get('orders').bind('remove', function(order, collection, options){
                    if (!self.multi_session.client_online) {
                        if (order.order_on_server ) {
                            self.multi_session.no_connection_warning();
                            if (self.debug){
                                console.log('PosModel initialize error');
                            }
                            return false;
                        }
                    }
                    order.ms_remove_order();
                });
                var channel_name = "pos.multi_session";
                var callback = self.ms_on_update;
                self.bus.add_channel_callback(channel_name, callback, self);
                if (self.config.sync_server){
                    callback = self.ms_on_update;
                    self.add_bus('sync_server', self.config.sync_server);
                    self.get_bus('sync_server').add_channel_callback(channel_name, callback, self);
                    self.sync_bus = self.get_bus('sync_server');
                    self.get_bus('sync_server').start();
                } else {
                    self.sync_bus = self.get_bus();
                    if (!self.config.autostart_longpolling) {
                        self.sync_bus.start();
                    }
                }

                self.multi_session = new exports.MultiSession(self);
                self.multi_session.request_sync_all();
            });
        },
        getUrlParameter: function(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName = '',
                i = 0;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return typeof sParameterName[1] === 'undefined'
                           ? true
                           : sParameterName[1];
                }
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
            // don't broadcast updates made from this message
            this.ms_syncing_in_progress = true;
            var error = false;
            var self = this;
            var data = '';
            var action = '';
            try{
                if (this.debug){
                    var logs = message;
                    if (this.stringify_logs) {
                        logs = JSON.stringify(logs);
                    }
                    console.log('MS', this.config.name, 'on_update:', logs);
                }
                action = message.action;
                data = message.data || {};
                var order = false;
                if (data.uid){
                    order = this.get('orders').find(function(item){
                        return item.uid === data.uid;
                    });
                }
                if (sync_all) {
                    this.message_ID = data.message_ID;
                    this.ms_do_update(order, data);
                } else {
                    if (self.message_ID + 1 === data.message_ID) {
                        self.message_ID = data.message_ID;
                    } else {
                        self.multi_session.request_sync_all();
                    }
                    if (order && action === 'remove_order') {
                        order.destroy({'reason': 'abandon'});
                    } else if (action === 'update_order'){
                        this.ms_do_update(order, data);
                    }
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
            var is_frozen = !current_order.ms_replace_empty_order;
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
            if (order){
                order.apply_ms_data(data);
            } else {
                var create_new_order = pos.config.multi_session_accept_incoming_orders || !(data.ms_info && data.ms_info.created.user.id !== pos.ms_my_info().user.id);
                if (!create_new_order){
                    return;
                }
                var json = {
                    sequence_number: data.sequence_number,
                    uid: data.uid,
                    run_ID: data.run_ID,
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
            }
            var not_found = order.orderlines.map(function(r){
                return r.uid;
            });
            if(data.partner_id === false) {
                order.set_client(null);
            } else {
                var client = order.pos.db.get_partner_by_id(data.partner_id);
                if(!client) {

                    $.when(this.load_new_partners_by_id(data.partner_id)).
                    then(function(new_client){
                        new_client = order.pos.db.get_partner_by_id(data.partner_id);
                        order.set_client(new_client);
                    }, function(){
                       // do nothing.
                    });
                }
                order.set_client(client);
            }

            _.each(data.lines, function(dline){
                dline = dline[2];
                var line = order.orderlines.find(function(r){
                    return dline.uid === r.uid;
                });
                not_found = _.without(not_found, dline.uid);
                var product = pos.db.get_product_by_id(dline.product_id);
                if (!line){
                    line = new models.Orderline({}, {pos: pos, order: order, product: product});
                    line.uid = dline.uid;
                }
                line.apply_ms_data(dline);
                order.orderlines.add(line);
            });

            _.each(not_found, function(uid){
                var line = order.orderlines.find(function(r){
                               return uid === r.uid;
                           });
                order.orderlines.remove(line);
            });
            order.order_on_server = true;
            order.new_order = false;
        },
        load_new_partners_by_id: function(partner_id){
            var self = this;
            var def = new $.Deferred();
            var fields = _.find(this.models,function(model){
                return model.model === 'res.partner';
            }).fields;
            new Model('res.partner').
                query(fields).
                filter([['id','=',partner_id]]).
                all({'timeout':3000, 'shadow': true}).
                then(function(partners){
                     // check if the partners we got were real updates
                    if (self.db.add_partners(partners)) {
                        def.resolve();
                    } else {
                        def.reject();
                    }
                }, function(err,event){
                    if (err) {
                        console.log(err);
                    }
                    event.preventDefault();
                    def.reject();
                });
            return def;
        },
    });

    chrome.OrderSelectorWidget.include({
        init: function(parent,options) {
            this._super(parent,options);
            this.saved_data = false;
            this.pos.get('orders').bind('change:update_new_order', this.renderElement,this );
        },
        destroy: function(){
            this.pos.get('orders').unbind('change:update_new_order', this.renderElement, this);
            this._super();
        },
        renderElement: function(){
            var self = this;
            if (this.compare_data()) {
                return false;
            }
            if (this.pos.debug) {
                console.log("renderElement of OrderSelectorWidget");
            }
            this._super();
            this.save_changes_data();
        },
        save_changes_data: function() {
            var orders = this.pos.get_order_list();
            var collection = [];
            var current_order = this.pos.get_order();
            var selected = false;
            orders.forEach(function(order) {
                if (current_order && current_order.uid === order.uid) {
                    selected = true;
                } else {
                    selected = false;
                }
                collection.push({
                    'sequence_number': order.sequence_number,
                    'new_order': order.new_order,
                    'selected': selected
                });
            });
            this.saved_data = JSON.stringify(collection);
        },
        compare_data: function() {
            var orders = this.pos.get_order_list();
            var collection = [];
            var current_order = this.pos.get_order();
            var selected = false;
            orders.forEach(function(order) {
                if (current_order && current_order.uid === order.uid) {
                    selected = true;
                } else {
                    selected = false;
                }
                collection.push({
                    'sequence_number': order.sequence_number,
                    'new_order': order.new_order,
                    'selected': selected
                });
            });
            return this.saved_data === JSON.stringify(collection);
        }
    });

    gui.Gui.include({
        _close: function() {
            this.closing = true;
            this._super();
        }
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
            if (!this.pos.config.multi_session_id){
                this.new_order = false;
                return;
            }
            this.ms_info = {};
            if (!this.revision_ID){
                this.revision_ID = options.revision_ID || 1;
            }
            if (!_.isEmpty(options.ms_info)){
                this.ms_info = options.ms_info;
            } else if (this.pos.config.multi_session_id){
                this.ms_info.created = this.pos.ms_my_info();
            }
            if (!this.run_ID) {
                this.run_ID = this.pos.multi_session_run_ID || 1;
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
            if (! this.pos.multi_session ){
                return;
            }
            if (this.pos.ms_syncing_in_progress){
                return;
            }
            if (this.temporary){
                return;
            }
            return true;
        },
        ms_update: function(){
            var self = this;
            if (this.new_order) {
                this.new_order = false;
                this.pos.pos_session.order_ID = this.pos.pos_session.order_ID + 1;
                this.sequence_number = this.pos.pos_session.order_ID;
                this.trigger('change:update_new_order');
            } else {
                this.trigger('change');
            }
            if (!this.ms_check()){
                return;
            }
            if (this.ms_update_timeout){
                // restart timeout
                clearTimeout(this.ms_update_timeout);
            }
            this.ms_update_timeout = setTimeout(
                function(){
                    self.ms_update_timeout = false;
                    self.do_ms_update();
                }, 0);
        },
        apply_ms_data: function(data) {
            if (OrderSuper.prototype.apply_ms_data) {
                OrderSuper.prototype.apply_ms_data.apply(this, arguments);
            }
            this.ms_info = data.ms_info;
            this.revision_ID = data.revision_ID;
            if (data.fiscal_position_id) {
                this.set_fiscal_position(data.fiscal_position_id);
            }
        },
        set_fiscal_position: function(id) {
            this.fiscal_position = _.find(this.pos.fiscal_positions, function(fp) {
                return fp.id === id;
            });
        },
        ms_remove_order: function(){
            if (!this.ms_check()){
                return;
            }
            this.do_ms_remove_order();
        },
        do_ms_remove_order: function(){
            var self = this;
            if (this.enquied){
                return;
            }
            var f = function(){
                self.enquied=false;
                return self.pos.multi_session.remove_order({'uid': self.uid, 'revision_ID': self.revision_ID}).done();
            };
            if (!this.pos.config.multi_session_id){
                return;
            }
            this.enquied = true;
            this.pos.multi_session.enque(f);
        },
        export_as_JSON: function(){
            var data = OrderSuper.prototype.export_as_JSON.apply(this, arguments);
            data.ms_info = this.ms_info;
            data.revision_ID = this.revision_ID;
            data.new_order = this.new_order;
            data.order_on_server = this.order_on_server;
            data.run_ID = this.run_ID;
            return data;
        },
        init_from_JSON: function(json) {
            this.new_order = json.new_order;
            this.order_on_server = json.order_on_server;
            this.revision_ID = json.revision_ID;
            this.run_ID = json.run_ID;
            OrderSuper.prototype.init_from_JSON.call(this, json);
        },
        do_ms_update: function(){
            var self = this;
            if (this.enquied){
                return;
            }
            var f = function(){
                self.enquied=false;
                var data = self.export_as_JSON();
                return self.pos.multi_session.update(data).done(function(res){
                    self.order_on_server = true;
                    if (res && res.action === "update_revision_ID") {
                        var server_revision_ID = res.revision_ID;
                        var order_ID = res.order_ID;
                        if (order_ID && self.sequence_number !== order_ID) {
                            self.sequence_number = order_ID;
                            // sequence number replace
                            self.pos.pos_session.order_ID = order_ID;
                            // rerender order
                            self.trigger('change');
                        }
                        if (server_revision_ID && server_revision_ID > self.revision_ID) {
                            self.revision_ID = server_revision_ID;
                            self.save_to_db();
                        }

                    }
                });
            };
            if (!this.pos.config.multi_session_id){
                return;
            }
            this.enquied = true;
            this.pos.multi_session.enque(f);
        }
    });
    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            this.ms_info = {};
            if (!this.order){
                // probably impossible case in odoo 10.0, but keep it here to remove doubts
                return;
            }
            this.uid = this.order.generate_unique_id() + '-' + this.id;
            if (this.order.screen_data.screen === "splitbill"){
                // ignore new orderline from splitbill tool
                return;
            }
            if (this.order.ms_check()){
                this.ms_info.created = this.order.pos.ms_my_info();
            }
            this.bind('change', function(line){
                if (self.order.ms_check() && !line.ms_changing_selected){
                    line.ms_info.changed = line.order.pos.ms_my_info();
                    line.order.ms_info.changed = line.order.pos.ms_my_info();
                    var order_lines = line.order.orderlines;
                    // to rerender line
                    order_lines.trigger('change', line);
                    line.order.trigger('change:sync');
                }
            });
        },
        /*  It is necessary to check the presence of the super method for the function,
            in order to be able to inherit the "apply_ms_data" function in other modules
            without specifying "require" of the "pos_multi_session" module (without adding in
            dependencies in the manifest).

            At the time of loading, the super method may not exist. So, if the js file is loaded
            first, among all inherited, then there is no super method and it is not called,
            if the file is not the first, then the super method is already created by other modules,
            and we inherit this function.
        */
        apply_ms_data: function(data) {
            if (OrderlineSuper.prototype.apply_ms_data) {
                OrderlineSuper.prototype.apply_ms_data.apply(this, arguments);
            }
            this.ms_info = data.ms_info || {};
            if(typeof data.qty !== "undefined"){
                this.set_quantity(data.qty);
            }
            if(typeof data.price_unit !== "undefined"){
                this.set_unit_price(data.price_unit);
            }
            if(typeof data.discount !== "undefined"){
                this.set_discount(data.discount);
            }
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
            var self = this;
            this.pos = pos;
            this.client_online = true;
            this.order_ID = null;
            this.update_queue = $.when();
            this.func_queue = [];
            this.on_syncing = false;
            this.pos.sync_bus.longpolling_connection.on("change:poll_connection", function(status){
                if (self.pos.gui.closing) {
                    return;
                }
                if (status) {
                    if (self.offline_sync_all_timer) {
                        clearInterval(self.offline_sync_all_timer);
                        self.offline_sync_all_timer = false;
                    }
                    self.request_sync_all();
                } else if (!self.offline_sync_all_timer) {
                    self.no_connection_warning();
                    self.start_offline_sync_timer();
                    if (self.pos.debug){
                        console.log('MultiSession initialize error');
                    }
                }
            });
        },
        request_sync_all: function(uid){
            if (this.on_syncing) {
                return;
            }
            var order_uid = uid || false;
            var self = this;
            this.on_syncing = true;
            var data = {run_ID: this.pos.multi_session_run_ID};
            var message = {'action': 'sync_all', data: data, 'uid': order_uid};
            return this.send(message).always(function(){
                self.on_syncing = false;
            });
        },
        sync_all: function(data) {
            var server_orders_uid = [];
            var self = this;
            function delay(ms) {
                var d = $.Deferred();
                setTimeout(function(){
                    d.resolve();
                }, ms);
                return d.promise();
            }

            framework.blockUI();
            this.q = $.when();
            data.orders.forEach(function (item, index) {
                self.q = self.q.then(function(){
                    self.pos.ms_on_update(item, true);
                    return delay(100);
                });
                server_orders_uid.push(item.data.uid);
            });

            self.q.then(function() {
                framework.unblockUI();
            });

            this.pos.pos_session.order_ID = data.order_ID;

            if (data.order_ID !== 0) {
                this.pos.pos_session.sequence_number = data.order_ID;
            }
            this.destroy_removed_orders(server_orders_uid);
        },
        remove_order: function(data){
            return this.send({action: 'remove_order', data: data});
        },
        update: function(data){
            return this.send({action: 'update_order', data: data});
        },
        enque: function(func){
            var self = this;
            this.func_queue.push(func);
            this.update_queue = this.update_queue.then(function() {
                if (self.func_queue[0]) {
                    var next = $.Deferred();
                    var func1 = self.func_queue.shift();
                    func1().always(function () {
                        next.resolve();
                    });
                    return next;
                }
            });
        },
        _debug_send_number: 0,
        send: function(message, address){
            var current_send_number = 0;
            if (this.pos.debug){
                var logs = message;
                if (this.pos.stringify_logs) {
                    logs = JSON.stringify(logs);
                }
                current_send_number = this._debug_send_number++;
                console.log('MS', this.pos.config.name, 'send #' + current_send_number +' :', logs);
            }
            var self = this;
            message.data.pos_id = this.pos.config.id;
            var send_it = function () {
                var temp = address
                ? address.serv
                : self.pos.config.sync_server || '';
                return openerp.session.rpc(temp + "/pos_multi_session_sync/update", {
                    multi_session_id: self.pos.config.multi_session_id[0],
                    message: message,
                    dbname: session.db,
                    user_ID: self.pos.user.id
                },{timeout:2500});
            };
            return send_it().fail(function (error, e) {
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'failed request #'+current_send_number+':', error.message);
                }
                if(error.data.type === "xhrerror" || (error.data.name && error.data.name.search('NotFound'))) {
                    self.client_online = false;
                    e.preventDefault();
                    self.pos.sync_bus.longpolling_connection.network_is_off();
                    if (!self.offline_sync_all_timer) {
                        if (self.pos.debug){
                            console.log('send, return send_it error');
                        }
                        self.no_connection_warning();
                        self.start_offline_sync_timer();
                    }
                } else {
                    self.request_sync_all();
                }
            }).done(function(res){
                if (self.pos.debug){
                    var logs_res = res;
                    if (self.pos.stringify_logs) {
                        logs_res = JSON.stringify(logs_res);
                    }
                    console.log('MS', self.pos.config.name, 'response #'+current_send_number+':', logs_res);
                }
                self.client_online = true;

                if (res.action === "revision_error") {
                    var warning_message = _t('There is a conflict during synchronization, try your action again');
                    self.warning(warning_message);
                    self.request_sync_all(res.order_uid);
                }
                if (res.action === 'sync_all') {
                    self.sync_all(res);
                }
                if (res.action === 'sync_order') {
                    self.pos.ms_on_update(res.orders, true);
                    self.pos.pos_session.order_ID = res.order_ID;

                    if (res.order_ID !== 0) {
                        self.pos.pos_session.sequence_number = res.order_ID;
                    }
                }
                if (self.offline_sync_all_timer) {
                    clearInterval(self.offline_sync_all_timer);
                    self.offline_sync_all_timer = false;
                }
                self.pos.longpolling_connection.network_is_on();
            });
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
                    var order = self.pos.get('orders').find(function (ord) {
                        return ord.uid === item.uid;
                    });
                    order.destroy({'reason': 'abandon'});
                }
            });
            self.send_offline_orders();
        },
        warning: function(warning_message){
            console.info('warning', warning_message);
            if (_.keys(this.pos.gui.popup_instances).length) {
                this.pos.chrome.gui.show_popup('error',{
                    'title': _t('Warning'),
                    'body': warning_message,
                });
            }
        },
        send_offline_orders: function() {
            var self = this;
            var orders = this.pos.get("orders");
            orders.each(function(item) {
                if (!item.order_on_server && item.get_orderlines().length > 0) {
                    item.ms_update();
                }
            });
        },
        start_offline_sync_timer: function(){
            var self = this;
            self.offline_sync_all_timer = setInterval(function(){
                self.request_sync_all();
            }, 5000 + (Math.floor((Math.random()*10)+1)*1000));
        },
        no_connection_warning: function(){
            var warning_message = _t("No connection to the server. You can create new orders only. It is forbidden to modify existing orders.");
            this.warning(warning_message);
        }
    });
    return exports;
});
