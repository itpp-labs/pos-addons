openerp.pos_multi_session = function(instance){

    var module = instance.point_of_sale;
    var _t = instance.web._t;

    module.OrderWidget.include({
        rerender_orderline: function(order_line){
            if (order_line.node && order_line.node.parentNode) {
                return this._super(order_line);
            }
        },
        remove_orderline: function(order_line){
            if (order_line.node.parentNode) {
                return this._super(order_line);
            }
            if (this.pos.get('selectedOrder').get('orderLines').length === 0 ) {
                return this._super(order_line);
            }
        }
    });
    module.ReceiptScreenWidget = module.ReceiptScreenWidget.extend({
        finishOrder: function() {
            this.pos.get('selectedOrder').destroy({'reason': 'finishOrder'});
        }
    });

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
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
            this.multi_session = new module.MultiSession(this);
            var channel_name = "pos.multi_session";
            var callback = this.ms_on_update;
            this.add_channel(channel_name, callback, this);


        },
        init_multi_session: function(){
            if (this.config.multi_session_id){
                this.multi_session.request_sync_all();
            }
        },
        ms_my_info: function(){
            return {
                'user': {
                    'id': this.pos_session.user_id[0],
                    'name': this.pos_session.user_id[1],
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
                    if (order && action == 'remove_order')
                        order.destroy({'reason': 'abandon'});
                    else if (action == 'update_order')
                        this.ms_do_update(order, data);
                }
            }catch(err){
                error = err;
                console.error(err);
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
            return new module.Order(options);
        },
        ms_do_update: function(order, data){
            var pos = this;
            this.pos_session.order_ID = data.sequence_number;
            if (!order){
                var create_new_order = pos.config.multi_session_accept_incoming_orders || !(data.ms_info && data.ms_info.created.user.id != pos.ms_my_info().user.id);
                if (!create_new_order){
                    return;
                }
                order = this.ms_create_order({ms_info:data.ms_info, revision_ID:data.revision_ID});
                order.uid = data.uid;
                order.sequence_number = data.sequence_number;
                order.new_order = false;
                var current_order = this.get_order();
                this.get('orders').add(order);
                this.ms_on_add_order(current_order);
            } else {
                order.ms_info = data.ms_info;
                order.revision_ID = data.revision_ID;
            }
            var not_found = order.get('orderLines').map(function(r){
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
                var line = order.get('orderLines').find(function(r){
                    return dline.uid == r.uid;
                });
                not_found = _.without(not_found, dline.uid);
                var product = pos.db.get_product_by_id(dline.product_id);
                if (!line){
                    line = new module.Orderline({}, {pos: pos, order: order, product: product});
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
                order.get('orderLines').add(line);
            });

            _.each(not_found, function(uid){
                var line = order.get('orderLines').find(function(r){
                               return uid == r.uid;
                           });
                order.get('orderLines').remove(line);
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

    module.OrderButtonWidget = module.OrderButtonWidget.extend({
        init: function(parent,options) {
            this._super(parent,options);
            this.order = options.order;
            this.order.bind('change:update_new_order', this.renderElement,this );
        },
        destroy: function(){
            this.pos.unbind('change:update_new_order', this.renderElement, this);
            this._super();
        },
    });

    var is_first_order = true;
    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        initialize: function(options){
            var self = this;
            this.new_order = true;
            options = options || {};
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
        removeOrderline: function(line){
            OrderSuper.prototype.removeOrderline.apply(this, arguments);
            line.order.trigger('change:sync');
        },
        set_client: function(client){
            OrderSuper.prototype.set_client.apply(this,arguments);
            this.trigger('change:sync');
        },
        addProduct: function(){
            var self = this;
            OrderSuper.prototype.addProduct.apply(this, arguments);
            this.trigger('change:sync');
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
                }, 0);
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
            return data;
        },
        do_ms_update: function(){
            var self = this;
            if (this.enquied)
                return;
            var f = function(){
                self.enquied=false;
                var data = self.export_as_JSON();
                return self.pos.multi_session.update(data).done(function(res){
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
                })
            };
            this.enquied = true;
            this.pos.multi_session.enque(f)
        }
    });
    var OrderlineSuper = module.Orderline;
    module.Orderline = module.Orderline.extend({
        initialize: function(){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            this.ms_info = {};
            if (this.order.ms_check()){
                this.ms_info.created = this.order.pos.ms_my_info();
            }
            this.bind('change', function(line){
                if (self.order.ms_check() && !line.ms_changing_selected){
                    line.ms_info.changed = line.order.pos.ms_my_info();
                    line.order.ms_info.changed = line.order.pos.ms_my_info();
                    var order_lines = line.order.get('orderLines');
                    order_lines.trigger('change', order_lines); // to rerender line
                    line.order.trigger('change:sync');
                }
            });
            this.uid = this.order.generateUniqueId() + '-' + this.id;
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

    module.MultiSession = Backbone.Model.extend({
        initialize: function(pos){
            var self = this;
            this.pos = pos;
            this.client_online = true;
            this.order_ID = null;
            this.update_queue = $.when();
            this.func_queue = [];
            this.pos.longpolling_connection.on("change:poll_connection", function(status){
                if (status) {
                    if (self.offline_sync_all_timer) {
                        clearInterval(self.offline_sync_all_timer);
                        self.offline_sync_all_timer = false;
                    }
                    self.request_sync_all().done(function(){
                        var element = $(".modal-popup-preload");
                        if (!element.hasClass("oe_hidden")) {
                            element.addClass("oe_hidden");
                        }
                    });
                } else {
                    var warning_message = _t("No connection to the server. You can only create new orders. It is forbidden to modify existing orders.");
                    self.warning(warning_message);
                    self.start_offline_sync_timer();
                }
            });
        },
        request_sync_all: function(){
            var data = {};
            return this.send({'action': 'sync_all', data: data});
        },
        remove_order: function(data){
            this.send({action: 'remove_order', data: data});
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
                        next.resolve()
                    });
                    return next;
                }
            })
        },
        _debug_send_number: 0,
        send: function(message){
            var current_send_number = 0;
            if (this.pos.debug){
                current_send_number = this._debug_send_number++;
                console.log('MS', this.pos.config.name, 'send #' + current_send_number +' :', JSON.stringify(message));
            }
            var self = this;
            message.data.pos_id = this.pos.config.id;
            var send_it = function () {
                return openerp.session.rpc("/pos_multi_session/update", {
                    multi_session_id: self.pos.config.multi_session_id[0],
                    message: message
                });
            };
            return send_it().fail(function (error, e) {
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'failed request #'+current_send_number+':', error.message);
                }
                if(error.message === 'XmlHttpRequestError ') {
                    self.client_online = false;
                    e.preventDefault();
                    self.pos.longpolling_connection.set_status(false);
                } else {
                    self.request_sync_all();
                }
            }).done(function(res){
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'response #'+current_send_number+':', JSON.stringify(res));
                }
                self.pos.longpolling_connection.set_status(true);

                var server_orders_uid = [];
                self.client_online = true;
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
                    var order = self.pos.get('orders').find(function (order) {
                        return order.uid == item.uid;
                    });
                    order.destroy({'reason': 'abandon'});
                }
            });
            self.send_offline_orders();
        },
        warning: function(warning_message){
            console.info('warning', warning_message);
            var self = this;
            new instance.web.Dialog(this, {
                title: _t("Warning"),
                size: 'medium',
            }, $("<div />").text(warning_message)).open();
        },
        send_offline_orders: function() {
            var self = this;
            var orders = this.pos.get("orders");
            orders.each(function(item) {
                if (!item.order_on_server && item.get('orderLines').length > 0) {
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
    });
    module.PreloadPopupWidget = module.PopUpWidget.extend({
        template:'PreloadPopupWidget',
    });
    module.PosWidget.include({
        build_widgets: function() {
            this._super();
            this.preload_popup = new module.PreloadPopupWidget(this, {});
            this.preload_popup.appendTo(this.$el);
            this.screen_selector.popup_set['preload'] = this.preload_popup;
        },
    });
};
