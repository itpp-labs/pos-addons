openerp.pos_multi_session = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    module.OrderWidget.include({
        rerender_orderline: function(order_line){
            if (order_line.node)
                return this._super(order_line);
        }
    })

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments)
            this.multi_session = false;
            this.ready = this.ready.then(function(){
                             if (self.config.multi_session_id){
                                 self.multi_session = new module.MultiSession(self);
                                 return self.multi_session.start();
                             }
                         });
            this.multi_session_syncing_in_progress = false;
            this.multi_session_update_timeout = false;
        },
        multi_session_on_update: function(data){
            this.multi_session_syncing_in_progress = true;
            console.log('on_update', data)
            var pos = this;
            var sequence_number = data.sequence_number;
            this.pos_session.sequence_number = Math.max(this.pos_session.sequence_number, sequence_number + 1);

            var order = this.get('orders').find(function(order){
                return order.uid == data.uid;
            })
            if (!order){
                order = new module.Order({pos:pos});
                order.uid = data.uid;
                order.sequence_number = data.sequence_number
                var current_order = this.get_order();
                this.get('orders').add(order);
                // keep current_order active
                this.set('selectedOrder', current_order);
            }
            _.each(data.lines, function(dline){
                dline = dline[2];
                var line = order.get('orderLines').find(function(r){
                    return dline.uid == r.uid
                })
                var product = pos.db.get_product_by_id(dline.product_id);
                if (!line){
                    line = new module.Orderline({}, {pos: pos, order: order, product: product});
                    line.uid = dline.uid
                }
                if(dline.qty !== undefined){
                    line.set_quantity(dline.qty);
                }
                if(dline.price_unit !== undefined){
                    line.set_unit_price(dline.price_unit);
                }
                if(dline.discount !== undefined){
                    line.set_discount(dline.discount);
                }
                order.get('orderLines').add(line)
            })

            this.multi_session_syncing_in_progress = false;
        }
    })

    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        initialize: function(){
            var self = this;
            OrderSuper.prototype.initialize.apply(this, arguments);
            this.get('orderLines').bind('remove', function(){
                self.trigger('change:sync')
            })
            this.bind('change:sync', function(){
                self.multi_session_update();
            })
        },
        multi_session_update: function(){
            var self = this;
            if (! this.pos.multi_session )
                return;
            if (this.pos.multi_session_syncing_in_progress)
                return;
            if (this.pos.multi_session_update_timeout)
                // restart timeout
                clearTimeout(this.pos.multi_session_update_timeout)
            this.pos.multi_session_update_timeout = setTimeout(
                function(){
                    self.pos.multi_session_update_timeout = false;
                    self.do_multi_session_update();
                }, 300)
        },
        do_multi_session_update: function(){
            var data = this.export_as_JSON();
            this.pos.multi_session.update(data);
        }
    })
    var OrderlineSuper = module.Orderline;
    module.Orderline = module.Orderline.extend({
        initialize: function(){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            this.bind('change', function(line){
                line.order.trigger('change:sync')
            })
            this.uid = this.order.generateUniqueId() + '-' + this.id;
        },
        export_as_JSON: function(){
            var data = OrderlineSuper.prototype.export_as_JSON.apply(this, arguments);
            data.uid = this.uid;
            return data;
        }
    })

    module.MultiSession = Backbone.Model.extend({
        initialize: function(pos){
            this.pos = pos;
        },
        start: function(){
            var self = this;
            //var  done = new $.Deferred();

            this.bus = instance.bus.bus;
            this.bus.on("notification", this, this.on_notification);
            this.bus.start_polling();

            //return done;
        },
        update: function(data){
            console.log('update', data)
            var self = this;
            var send_it = function() {
                return openerp.session.rpc("/pos_multi_session/update", {multi_session_id: self.pos.config.multi_session_id[0], data: data});
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
                this.pos.multi_session_on_update(message)
            }
        }
    })
}