odoo.define('pos_multi_session', function(require){
    var exports = {}

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens')
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');

    var _t = core._t;

    screens.OrderWidget.include({
        rerender_orderline: function(order_line){
            if (order_line.node)
                return this._super(order_line);
        },
        remove_orderline: function(order_line){
            if (!this.pos.get_order())
                return;
            this._super(order_line)
        },
    })
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
    })

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments)
            this.multi_session = false;
            this.ready = this.ready.then(function(){
                             if (self.config.multi_session_id){
                                 self.multi_session = new exports.MultiSession(self);
                                 self.multi_session.start();
                                 self.multi_session.request_sync_all();
                             }
                         });
            this.ms_syncing_in_progress = false;
            this.get('orders').bind('remove', function(order,_unused_,options){ 
                order.ms_remove_order();
            });
            this.get('orders').bind('add', function(order,_unused_,options){ 
                if (!self.ms_syncing_in_progress && self.multi_session){
                    self.multi_session.sync_sequence_number();
                }
            });

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
            }
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
                    if (this.get('orders').size() == 0){
                        this.add_new_order();
                    }
                    return;
                }
            }
            var self = this;
            return PosModelSuper.prototype.on_removed_order.apply(this, arguments)
        },

        ms_on_update: function(message){
            this.ms_syncing_in_progress = true; // don't broadcast updates made from this message
            var error = false;
            try{
                console.log('on_update', message)
                var action = message.action;
                var data = message.data || {}
                var order = false;
                if (data.uid){
                    order = this.get('orders').find(function(order){
                                return order.uid == data.uid;
                            })
                }
                if (order && action == 'remove_order'){
                    order.destroy({'reason': 'abandon'})
                } else if (action == 'update') {
                    this.ms_do_update(order, data);
                }
            }catch(err){
                error = err;
                console.error(err);
            }
            this.ms_syncing_in_progress = false;
            if (error){
                throw(error)
            }

            if (action == 'sync_sequence_number'){
                this.ms_do_sync_sequence_number(data);
            } else if (action == 'request_sync_all'){
                //don't executing sync_sequence_number, because new POS sync sequence_number on start, because new order is created automatically
                //this.multi_session.sync_sequence_number();
                _.each(this.ms_orders_to_sync(), function(r){
                    if (!r.is_empty()){
                        r.ms_update();
                    }
                })
            }
        },
        ms_orders_to_sync: function(){
            return this.get('orders').models;
        },
        ms_on_add_order: function(current_order){
            if (current_order && current_order.ms_replace_empty_order && current_order.is_empty()){
                //replace order
                current_order.destroy({'reason': 'abandon'})
            }else{
                // keep current_order active
                this.set('selectedOrder', current_order);
            }
        },
        ms_create_order: function(options){
            options = _.extend({pos: this}, options || {});
            return new models.Order({}, options);
        },
        ms_do_sync_sequence_number: function(data){
            if (data.sequence_number < this.pos_session.sequence_number){
                // another pos has obsolete sequence_number
                this.multi_session.sync_sequence_number(this.pos_session.sequence_number);
            } else {
                // update sequence_number (value for next number)
                this.pos_session.sequence_number = data.sequence_number;
            }
            /*
            this.get('orders').each(function(r){
                var sn = data[r.uid];
                if (sn != r.sequence_number){
                    r.sequence_number = sn;
                }
            })
             */
        },
        ms_do_update: function(order, data){
            var pos = this;
            var sequence_number = data.sequence_number;
            if (!order){
                var create_new_order = pos.config.multi_session_accept_incoming_orders || !(data.ms_info && data.ms_info.created.user.id != pos.ms_my_info().user.id)
                if (sequence_number == this.pos_session.sequence_number){
                    //ok
                } else if (sequence_number > this.pos_session.sequence_number){
                    // this pos has obsolete sequence_number
                    this.pos_session.sequence_number = sequence_number;
                } else if (sequence_number < this.pos_session.sequence_number){
                    // another pos has obsolete sequence_number
                    pos.multi_session.sync_sequence_number();
                    if (create_new_order)
                        this.pos_session.sequence_number--; // decrease temporarily, because it is increased right after creating new order
                }
                if (!create_new_order){
                    return;
                }
                order = this.ms_create_order({ms_info:data.ms_info})
                order.uid = data.uid;
                order.sequence_number = data.sequence_number
                var current_order = this.get_order();
                this.get('orders').add(order);
                this.ms_on_add_order(current_order);
            } else {
                order.ms_info = data.ms_info;
            }
            var not_found = order.orderlines.map(function(r){
                                return r.uid;
                            })
            _.each(data.lines, function(dline){
                dline = dline[2];
                var line = order.orderlines.find(function(r){
                    return dline.uid == r.uid
                })
                not_found = _.without(not_found, dline.uid);
                var product = pos.db.get_product_by_id(dline.product_id);
                if (!line){
                    line = new models.Orderline({}, {pos: pos, order: order, product: product});
                    line.uid = dline.uid
                }
                line.ms_info = dline.ms_info || {}
                if(dline.qty !== undefined){
                    line.set_quantity(dline.qty);
                }
                if(dline.price_unit !== undefined){
                    line.set_unit_price(dline.price_unit);
                }
                if(dline.discount !== undefined){
                    line.set_discount(dline.discount);
                }
                order.orderlines.add(line)
            })

            _.each(not_found, function(uid){
                var line = order.orderlines.find(function(r){
                               return uid == r.uid;
                           })
                order.orderlines.remove(line);
            })

        }
    })

    var is_first_order = true;
    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        initialize: function(attributes, options){
            var self = this;
            options = options || {}
            OrderSuper.prototype.initialize.apply(this, arguments);
            this.ms_info = {}
            if (!_.isEmpty(options.ms_info)){
                this.ms_info = options.ms_info;
            } else if (this.pos.multi_session){
                this.ms_info['created'] = this.pos.ms_my_info();
            }
            this.ms_replace_empty_order = is_first_order;
            is_first_order = false;
            this.bind('change:sync', function(){
                self.ms_update();
            })
        },
        remove_orderline: function(line){
            OrderSuper.prototype.remove_orderline.apply(this, arguments);
            line.order.trigger('change:sync');
        },
        add_product: function(){
            OrderSuper.prototype.add_product.apply(this, arguments);
            this.trigger('change:sync')
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
            if (!this.ms_check())
                return;
            if (this.ms_update_timeout)
                // restart timeout
                clearTimeout(this.ms_update_timeout)
            this.ms_update_timeout = setTimeout(
                function(){
                    self.ms_update_timeout = false;
                    self.do_ms_update();
                }, 300)
        },
        ms_remove_order: function(){
            if (!this.ms_check())
                return;
            this.do_ms_remove_order();
        },
        do_ms_remove_order: function(){
            this.pos.multi_session.remove_order({'uid': this.uid});
        },
        export_as_JSON: function(){
            var data = OrderSuper.prototype.export_as_JSON.apply(this, arguments);
            data.ms_info = this.ms_info;
            return data;
        },
        do_ms_update: function(){
            var data = this.export_as_JSON();
            this.pos.multi_session.update(data);
        }
    })
    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            this.ms_info = {}
            if (!this.order)
                // ignore new orderline from splitbill tool
                return;
            if (this.order.ms_check()){
                this.ms_info['created'] = this.order.pos.ms_my_info();
            }
            this.bind('change', function(line){
                if (self.order.ms_check() && !line.ms_changing_selected){
                    line.ms_info['changed'] = line.order.pos.ms_my_info();
                    line.order.ms_info['changed'] = line.order.pos.ms_my_info();
                    var order_lines = line.order.orderlines;
                    order_lines.trigger('change', order_lines); // to rerender line
                    line.order.trigger('change:sync')
                }
            })
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
    })

    exports.MultiSession = Backbone.Model.extend({
        initialize: function(pos){
            this.pos = pos;
        },
        start: function(){
            var self = this;
            //var  done = new $.Deferred();

            this.bus = bus.bus;
            this.bus.last = this.pos.db.load('bus_last', 0);
            this.bus.on("notification", this, this.on_notification);
            this.bus.start_polling();

            //return done;
        },
        request_sync_all: function(){
            this.send({'action': 'request_sync_all'})
        },
        sync_sequence_number: function(){
            var orders = {};
            this.pos.get('orders').each(function(r){
                orders[r.uid] = r.sequence_number;
            })
            var data = {
                'sequence_number': this.pos.pos_session.sequence_number,
                //'orders': orders,
            }
            this.send({action: 'sync_sequence_number', data: data})
        },
        remove_order: function(data){
            this.send({action: 'remove_order', data: data})
        },
        update: function(data){
            this.send({action: 'update', data: data})
        },
        send: function(message){
            console.log('send', message)
           var self = this;
            var send_it = function() {
                return session.rpc("/pos_multi_session/update", {multi_session_id: self.pos.config.multi_session_id[0], message: message});
            };
            var tries = 0;
            send_it().fail(function(error, e) {
                e.preventDefault();
                tries += 1;
                if (tries < 3)
                    return send_it();
            });
        },
        on_notification: function(notification) {
            var self = this;
            var channel = notification[0];
            var message = notification[1];

            if(Array.isArray(channel) && channel[1] === 'pos.multi_session'){
                try{
                    this.pos.ms_on_update(message)
                }catch(err){
                    this.pos.chrome.gui.show_popup('error',{
                        'title': _t('Error'),
                        'body': err,
                    })
                }
            }
            this.pos.db.save('bus_last', this.bus.last)
        }
    })
    return exports;
})