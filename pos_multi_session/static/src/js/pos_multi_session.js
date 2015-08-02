openerp.pos_multi_session = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;

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
        },
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

            this.update('ping '+instance.session.uid)
            //return done;
        },
        update: function(data){
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
                alert (message)
                return;
                // message to display in the chatview
                if (message.type === "message" || message.type === "meta") {
                    self.received_message(message);
                }
                // activate the received session
                if(message.uuid){
                    this.apply_session(message);
                }
                // user status notification
                if(message.im_status){
                    self.trigger("im_new_user_status", [message]);
                }
            }
        }
    })
}