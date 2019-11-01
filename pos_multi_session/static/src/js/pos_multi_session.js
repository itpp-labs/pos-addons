/* Copyright 2015-2016,2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2015-2016 Ilyas Rakhimkulov
 * Copyright 2016 Gael Torrecillas
 * Copyright 2016-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2017-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * Copyright 2017 David Arnold
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_multi_session', function(require){
    var exports = {};

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var chrome = require('point_of_sale.chrome');
    var longpolling = require('pos_longpolling.connection');
    var rpc = require('web.rpc');
    var gui = require('point_of_sale.gui');
    var posDB = require('point_of_sale.DB');

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
        bind_order_events: function() {
            this._super();
            var order = this.pos.get_order();
            order.unbind('change:newLines', this.change_current_order, this);
            order.bind('change:newLines', this.change_current_order, this);
        },
        change_current_order: function() {
            if (this.pos.get_order()) {
                this.renderElement('and_scroll_to_bottom');
            }
        },
        orderline_add: function(){
            var options = arguments && arguments[2]
            ? arguments[2]
            : {};
            if (options.not_render) {
                this.numpad_state.reset();
            } else {
                this._super();
            }
        },
        rerender_orderline: function(order_line){
            if (order_line.node && order_line.node.parentNode) {
                return this._super(order_line);
            }
        },
        remove_orderline: function(order_line){
            if (order_line.node && order_line.node.parentNode) {
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
                self.pos.get_order().trigger('new_updates_to_send');
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
                fields: ['run_ID', 'multi_session_active'],
                domain: function(){
                    return [['id', '=', self.config.multi_session_id[0]]];
                },
                loaded: function(me, current_session) {
                    self.multi_session_active = current_session[0].multi_session_active;
                    if (self.multi_session_active) {
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
                if (!self.multi_session_active){
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
                    order.order_removing_to_send();
                });
                var channel_name = "pos.multi_session";
                var callback = self.updates_from_server_callback;
                self.bus.add_channel_callback(channel_name, callback, self);
                if (self.config.sync_server){
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
                self.multi_session.bind_ms_connection_events();
            });
        },
        after_load_server_data: function() {
            var self = this;
            var res = PosModelSuper.prototype.after_load_server_data.apply(this, arguments);
            if (!this.multi_session_active){
                return res;
            }
            this.multi_session = new exports.MultiSession(self);
            var done = new $.Deferred();

            $.when(res).then(function() {
                self.chrome.loading_skip();
                var progress = (self.models.length - 0.5) / self.models.length;
                self.chrome.loading_message(_t('Sync Orders'), progress);

                var load_sync_all_request = function(){
                    var response = self.multi_session.request_sync_all({'immediate_rerendering': true});
                    if (!response) {
                        return false;
                    }
                    return response.then(function() {
                        self.is_loaded = true;
                        done.resolve();
                    }).fail(function(){
                        setTimeout(function(){
                            // timeout is set to avoid excessive requests
                            load_sync_all_request();
                        }, 2000);
                    });
                }

                load_sync_all_request();
            });
            return done;
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
            var user = this.get_cashier() || this.user;
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
                    if (this.get('orders').size() === 0 && this.gui.get_current_screen() !== "floors") {
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
        updates_from_server_callback: function(message){
            var self = this;
            // there are two types of message construction, get_attr extract required data from either of them
            var get_attr = function(obj, attr){
                return obj[attr] || obj.data && obj.data[attr];
            }
            var same_session_check = get_attr(message, 'session_id') === this.pos_session.id;
            var same_login_check = get_attr(message, 'login_number') === this.pos_session.login_number;
            if (same_session_check &&
                ((same_login_check && message.action !== "sync_all") ||
                (!same_login_check && message.action === "sync_all"))){
                // we don't process updates were send from this device
                // keep the same message_ID among the same POS to prevent endless sync_all requests
                this.message_ID = message.data.message_ID;
                return;
            }
            return this.updates_from_server(message);
        },
        updates_from_server: function(message){
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
                if (action === 'sync_all') {
                    this.message_ID = data.message_ID;
                    var server_orders_uids = _.map(data.orders, function(o){
                        return o.data.uid;
                    });
                    _.each(data.orders, function(received_data){
                        order = self.get('orders').find(function(item){
                            return item.uid === received_data.data.uid;
                        }) || false;
                        self.ms_update_order(order, received_data.data);
                    });
                    this.pos_session.order_ID = data.order_ID;
                    var sequence_number = this.pos_session.sequence_number;
                    if (sequence_number && sequence_number < (data.order_ID + 1 || 1)) {
                        // that's a case when sync_all request response comes earlier than created offline orders were sent
                        this.pos_session.sequence_number = data.order_ID + 1 || 1;
                    }
                    this.ms_syncing_in_progress = false;
                    if (!data.uid){
                        // if it wasnt sync for only one order
                        this.multi_session.destroy_removed_orders(server_orders_uids);
                    }
                } else {
                    if (data.uid){
                        order = this.get('orders').find(function(item){
                            return item.uid === data.uid;
                        });
                    }
                    if (self.message_ID + 1 === data.message_ID) {
                        self.message_ID = data.message_ID;
                    } else {
                        self.multi_session.request_sync_all();
                    }
                    if (order && action === 'remove_order') {
                        order.destroy({'reason': 'abandon'});
                    } else if (action === 'update_order'){
                        this.ms_update_order(order, data);
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
        ms_create_order: function(options) {
            options = _.extend({pos: this}, options || {});
            var order = new models.Order({}, options);
            return order;
        },
        ms_update_existing_order: function(order, data) {
            // update existing order
            var pos = this;
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

            var added_new_lines = false;
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
                    line.apply_ms_data(dline);
                    order.orderlines.add(line, {'not_render': true});
                    added_new_lines = true;
                } else if (dline.is_changed) {
                    line.apply_ms_data(dline);
                }
                line.offline_orderline = false;
            });
            if (added_new_lines && this.get_order() && order.uid === this.get_order().uid) {
                order.trigger('change:newLines', order);
            }
            _.each(not_found, function(uid){
                var line = order.orderlines.find(function(r){
                    return uid === r.uid;
                });
                if (!line.offline_orderline) {
                    order.orderlines.remove(line);
                }
            });
            order.order_on_server = true;
            order.new_order = false;
            order.init_locked = false;

            var offline_orderlines = order.orderlines.filter(function(line) {
                return line.offline_orderline;
            });
            if (offline_orderlines && offline_orderlines.length) {
                // sync the order
                this.ms_syncing_in_progress = false;
                order.new_updates_to_send();
                order.trigger('new_updates_to_send');
            }
        },
        ms_update_order: function(order, data) {
            if (order && order.finalized) {
                // if true, cannot be modified. - According to Odoo
                return;
            }
            var pos = this;
            this.pos_session.order_ID = data.sequence_number;
            if (order){
                // init_locked blocks execution of save_to_db
                order.init_locked = true;
                order.apply_ms_data(data);
                this.ms_update_existing_order(order, data);
            } else {
                var create_new_order = pos.config.multi_session_accept_incoming_orders || !(data.ms_info && data.ms_info.created.user.id !== pos.ms_my_info().user.id);
                if (!create_new_order){
                    return;
                }
                var json = _.extend(data, {
                    order_on_server: true,
                });
                order = this.ms_create_order({ms_info:data.ms_info, revision_ID:data.revision_ID, json: json});
                if (order) {
                    var current_order = this.get_order();
                    this.get('orders').add(order);
                    this.ms_on_add_order(current_order);
                    order.set_orderlines_offline();
                }
                return;
            }
        },
        load_new_partners_by_id: function(partner_id){
            var self = this;
            var def = new $.Deferred();
            var fields = _.find(this.models,function(model){
                return model.model === 'res.partner';
            }).fields;
            var domain = [['id','=',partner_id]];
            rpc.query({
                    model: 'res.partner',
                    method: 'search_read',
                    args: [domain, fields],
                }, {
                    timeout: 3000,
                    shadow: true,
                }).then(function(partners){
                     // check if the partners we got were real updates
                    if (self.db.add_partners(partners)) {
                        def.resolve();
                    } else {
                        def.reject();
                    }
                }, function(type,err){
                    if (err) {
                        console.log(err);
                    }
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

    posDB = posDB.include({
        get_unpaid_orders: function(){
            var self = this;
            var res = this._super(arguments);
            res = _.filter(res, function(o){
                var pos = window.posmodel;
                return o.run_ID === pos.multi_session_run_ID;
            });
            return res;
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
            if (!this.pos.multi_session_active){
                this.new_order = false;
                return;
            }
            this.ms_info = {};
            if (!this.revision_ID){
                this.revision_ID = options.revision_ID || 1;
            }
            if (!_.isEmpty(options.ms_info)){
                this.ms_info = options.ms_info;
            } else if (this.pos.multi_session_active){
                this.ms_info.created = this.pos.ms_my_info();
            }
            if (!this.run_ID) {
                this.run_ID = this.pos.multi_session_run_ID || 1;
            }
            this.ms_replace_empty_order = is_first_order;
            is_first_order = false;
            this.bind('new_updates_to_send', function(){
                self.new_updates_to_send();
            });
        },
        remove_orderline: function(line){
            OrderSuper.prototype.remove_orderline.apply(this, arguments);
            line.order.trigger('new_updates_to_send');
        },
        add_product: function(){
            this.trigger('new_updates_to_send');
            OrderSuper.prototype.add_product.apply(this, arguments);
        },
        set_client: function(client){
             /*  trigger event before calling add_product,
                 because event handler new_updates_to_send updates some values of the order (e.g. new_name),
                 while add_product saves order to localStorage.
                 So, calling add_product first would lead to saving obsolete values to localStorage.
                 From the other side, new_updates_to_send work asynchronously (via setTimeout) and will get updates from add_product method
             */
            var old_client = this.get_client();
            if (client || old_client) {
                this.trigger('new_updates_to_send');
            }
            OrderSuper.prototype.set_client.apply(this,arguments);
        },
        set_orderlines_offline: function() {
            _.map(this.get_orderlines(), function(line){
                line.offline_orderline = false;
            });
        },
        ms_active: function(){
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
        new_updates_to_send: function(){
            var self = this;
            if (this.new_order) {
                this.new_order = false;
                this.pos.pos_session.order_ID = this.pos.pos_session.order_ID + 1;
                this.trigger('change:update_new_order');
            } else {
                // save order to the local storage
                this.save_to_db();
            }
            if (!this.ms_active()){
                return;
            }
            if (this.new_updates_to_send_timeout){
                // restart timeout
                clearTimeout(this.new_updates_to_send_timeout);
            }
            this.new_updates_to_send_timeout = setTimeout(
                function(){
                    self.new_updates_to_send_timeout = false;
                    self.send_updates_to_server();
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
        order_removing_to_send: function(){
            if (!this.ms_active()){
                return;
            }
            var self = this;
            if (this.new_updates_to_send_timeout){
                // restart timeout
                clearTimeout(this.new_updates_to_send_timeout);
            }
            this.new_updates_to_send_timeout = setTimeout(function(){
                self.new_updates_to_send_timeout = false;
                self.send_order_removing_to_server();
            }, 0);
        },
        send_order_removing_to_server: function(){
            var self = this;
            if (this.enquied){
                return;
            }
            var f = function(){
                self.enquied=false;
                return self.pos.multi_session.remove_order({
                    'uid': self.uid,
                    'revision_ID': self.revision_ID,
                    'finalized': self.finalized,
                }).done();
            };
            if (!this.pos.multi_session_active){
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
            var self = this;
            this.new_order = json.new_order;
            this.order_on_server = json.order_on_server;
            this.revision_ID = json.revision_ID;
            this.run_ID = json.run_ID;
            // the journal may not exist for the current POS
            var statement_ids = json.statement_ids.filter(function (statement_id) {
                return self.pos.cashregisters_by_id[statement_id];
            });
            json.statement_ids = statement_ids;
            OrderSuper.prototype.init_from_JSON.call(this, json);
        },
        send_updates_to_server: function(){
            var self = this;
            if (this.enquied){
                return;
            }
            var f = function(){
                self.enquied=false;
                var data = self.export_as_JSON();
                return self.pos.multi_session.update(data).done(function(res){
                    self.order_on_server = true;
                    self.set_orderlines_offline();
                });
            };
            if (!this.pos.multi_session_active){
                return;
            }
            this.enquied = true;
            this.pos.multi_session.enque(f);
        },

        update_revision_id: function(res){
            var server_revision_ID = res.revision_ID;
            var order_ID = res.order_ID;
            if (order_ID && (this.sequence_number !== order_ID || this.pos.pos_session.sequence_number === order_ID)) {
                this.sequence_number = order_ID;
                // sequence number replace
                this.pos.pos_session.order_ID = order_ID;
                var sequence_number = this.pos.pos_session.sequence_number;
                this.pos.pos_session.sequence_number = Math.max(Boolean(sequence_number) && sequence_number, order_ID + 1 || 1);
                // rerender order
                this.trigger('change');
            }
            if (server_revision_ID && server_revision_ID > this.revision_ID) {
                this.revision_ID = server_revision_ID;
                this.save_to_db();
            }
        },
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
            if (this.order.ms_active()){
                this.ms_info.created = this.order.pos.ms_my_info();
            }
            // next line prevents assigning 'orderlines' as offline when pos is loading and data is taken from local storage
            this.offline_orderline = this.pos.ready.state() === "resolved";
            this.bind('change', function(line){
                if (self.order.ms_active() && !line.ms_changing_selected){
                    line.ms_info.changed = line.order.pos.ms_my_info();
                    line.order.ms_info.changed = line.order.pos.ms_my_info();
                    var order_lines = line.order.orderlines;
                    // to rerender line
                    order_lines.trigger('change', line);
                    line.order.trigger('new_updates_to_send');
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
            if(typeof data.qty !== "undefined" && data.qty !== this.quantity){
                this.set_quantity(data.qty);
            }
            if(typeof data.price_unit !== "undefined" && data.price_unit !== this.price){
                this.set_unit_price(data.price_unit);
            }
            if(typeof data.discount !== "undefined" && data.discount !== this.discount){
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
        },
        bind_ms_connection_events: function() {
            var self = this;
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
                    var popup = this.pos.gui.current_popup;
                    if (popup && popup.options.multi_session_connection_error) {
                        this.pos.gui.close_popup();
                    }
                } else if (!self.offline_sync_all_timer) {
                    self.no_connection_warning();
                    self.start_offline_sync_timer();
                    if (self.pos.debug){
                        console.log('MultiSession initialize error');
                    }
                }
            });
        },
        request_sync_all: function(options){
            if (this.on_syncing) {
                return false;
            }
            this.on_syncing = true;
            if (this.pos.db.get_orders().length) {
                var self = this;
                return this.send_paid_offline_orders().then(function () {
                    return self.sync_all(options);
                });
            }
            return this.sync_all(options);
        },
        sync_all: function(options) {
            options = options || {};
            var self = this;
            var data = {run_ID: this.pos.multi_session_run_ID};
            var message = {'action': 'sync_all', data: data};
            if (options.uid) {
                message.uid = options.uid;
            }
            if (options.immediate_rerendering) {
                message.immediate_rerendering = options.immediate_rerendering;
            }
            return this.send(message, options).always(function(){
                self.on_syncing = false;
            });
        },
        remove_order: function(data){
            data.run_ID = this.pos.multi_session_run_ID;
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
        get_nonce: function() {
            return (Math.random() + 1).toString(36).substring(7);
        },
        _debug_send_number: 0,
        send: function(message, options){
            options = options || {};
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
            message.data.nonce = this.get_nonce();
            message.session_id = this.pos.pos_session.id;
            message.login_number = this.pos.pos_session.login_number;
            var send_it = function () {
                var temp = self.pos.config.sync_server || '';
                if (options.address) {
                    temp = options.address.serv;
                }
                return session.rpc(temp + "/pos_multi_session_sync/update", {
                    multi_session_id: self.pos.config.multi_session_id[0],
                    message: message,
                    dbname: session.db,
                    user_ID: self.pos.user.id
                },{timeout:30000});
            };
            return send_it().fail(function (error, e) {
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'failed request #'+current_send_number+':', error.message);
                }
                if(error.data.type === "xhrerror" || (error.data.name && error.data.name.search('NotFound'))) {
                    self.client_online = false;
                    e.preventDefault();
                    if (self.pos.sync_bus) {
                        self.pos.sync_bus.longpolling_connection.network_is_off();
                    }
                    if (!self.offline_sync_all_timer) {
                        if (self.pos.debug) {
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
                    if (res.state == 'deleted') {
                        var removed_order = self.pos.get('orders').find(function(order){
                             return order.uid === res.order_uid;
                        });
                        if (removed_order) {
                            removed_order.destroy({'reason': 'abandon'});
                        }
                    } else {
                        var warning_message = _t('There is a conflict during synchronization, try your action again');
                        self.warning(warning_message);
                        self.request_sync_all({'uid': res.order_uid});
                    }
                }
                if (res.action === 'sync_all') {
                    self.pos.updates_from_server(res);
                }
                if (self.offline_sync_all_timer) {
                    clearInterval(self.offline_sync_all_timer);
                    self.offline_sync_all_timer = false;
                }
                if (self.pos.sync_bus) {
                    self.pos.sync_bus.longpolling_connection.network_is_on();
                }

                if (res && res.action === "update_revision_ID" && res.uid) {
                    var order = _.find(self.pos.get_order_list(), function(o){
                        return o.uid === res.uid;
                    });
                    if (order) {
                        order.update_revision_id(res);
                    }
                }
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
            self.send_draft_offline_orders();
        },
        warning: function(warning_message){
            console.info('warning', warning_message);
            if (_.keys(this.pos.gui.popup_instances).length) {
                this.pos.chrome.gui.show_popup('error',{
                    'title': _t('Warning'),
                    'body': warning_message,
                    'multi_session_connection_error': true,
                });
            }
        },
        send_draft_offline_orders: function() {
            var self = this;
            var orders = this.pos.get("orders");
            orders.each(function(item) {
                if (!item.order_on_server && item.get_orderlines().length > 0) {
                    item.new_updates_to_send();
                }
            });
        },
        send_paid_offline_orders: function() {
            var self = this;
            var orders = this.pos.db.get_orders();
            // sends multi_session updates for paid orders
            _.each(orders, function(item) {
                var f = function(){
                    return self.remove_order({
                        'uid': item.data.uid,
                        'revision_ID': item.data.revision_ID,
                        'finalized': true,
                        'order_data': JSON.stringify(item),
                    });
                };
                self.enque(f);
            });
            // sends paid offline orders to the server
            return this.pos.push_order();
        },
        start_offline_sync_timer: function(){
            var self = this;
            self.offline_sync_all_timer = setInterval(function(){
                self.request_sync_all();
            }, 5000 + (Math.floor((Math.random()*10)+1)*1000));
        },
        no_connection_warning: function(){
            if (this.pos.sync_bus && this.pos.sync_bus.sleep) {
                return;
            }
            var warning_message = _t("No connection to the server.");
            this.warning(warning_message);
        }
    });
    return exports;
});
