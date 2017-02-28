openerp.pos_longpolling = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    // prevent bus to be started by chat_manager.js
    openerp.bus.bus.activated = true; // fake value to ignore start_polling call

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.channels = {};
            this.lonpolling_activated = false;
            this.bus = openerp.bus.bus;
            this.longpolling_connection = new module.LongpollingConnection(this);
            var channel_name = "pos.longpolling";
            var callback = this.longpolling_connection.update_status;
            this.add_channel(channel_name, callback, this.longpolling_connection);
            this.ready.then(function () {
                self.start_longpolling();
            });
        },
        start_longpolling: function(){
            var self = this;
            this.bus.last = this.db.load('bus_last', 0);
            this.bus.on("notification", this, this.on_notification);
            this.bus.stop_polling();
            _.each(self.channels, function(value, key){
                self.init_channel(key);
            });
            this.bus.start_polling();
            this.lonpolling_activated = true;
            this.longpolling_connection.send();
        },
        add_channel: function(channel_name, callback, thisArg) {
            if (thisArg){
                callback = _.bind(callback, thisArg);
            }
            this.channels[channel_name] = callback;
            if (this.lonpolling_activated) {
                this.init_channel(channel_name);
            }
        },
        get_full_channel_name: function(channel_name){
            return JSON.stringify([openerp.session.db,channel_name,String(this.config.id)]);
        },
        init_channel: function(channel_name){
            var channel = this.get_full_channel_name(channel_name);
            this.bus.add_channel(channel);
        },
        remove_channel: function(channel_name) {
            if (channel_name in this.channels) {
                delete this.channels[channel_name];
                var channel = this.get_full_channel_name(channel_name);
                this.bus.delete_channel(channel);
            }
        },
        on_notification: function(notification) {
            if (typeof notification[0][0] === 'string') {
                notification = [notification];
            }
            for (var i = 0; i < notification.length; i++) {
                var channel = notification[i][0];
                var message = notification[i][1];
                this.on_notification_do(channel, message);
            }
            this.db.save('bus_last', this.bus.last);
        },
        on_notification_do: function (channel, message) {
            var self = this;
            var channel = JSON.parse(channel);
            if(Array.isArray(channel) && (channel[1] in self.channels)){
                try{
                    self.longpolling_connection.update_status();
                    var callback = self.channels[channel[1]];
                    if (callback) {
                        if (self.debug){
                            console.log('POS LONGPOLLING', self.config.name, channel[1], JSON.stringify(message));
                        }
                        callback(message);
                    }
                }catch(err){
                    self.pos_widget.screen_selector.show_popup('error',{
                        message: _t('Error'),
                        comment: err,
                    });
                }
            }
        }
    });

    module.LongpollingConnection = Backbone.Model.extend({
        initialize: function(pos) {
            this.pos = pos;
            this.timer = false;
            this.status = false;
        },
        set_status: function(status) {
            if (this.status == status) {
                return;
            }
            this.status = status;
            this.trigger("change:poll_connection", status);
            this.start_timer(this.pos.config.query_timeout, 'query');
        },
        update_status: function(message) {
            var self = this;
            if (this.pos.debug) {
                console.log("This message from server. Message: ", message);
            }
            self.stop_timer();
            self.set_status(true);
        },
        stop_timer: function(){
            var self = this;
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = false;
            }
        },
        start_timer: function(time, type){
            var time = Math.round(time * 3600.0);
            var self = this;
            this.stop_timer();
            this.timer = setTimeout(function() {
                if (type == "query") {
                    self.send();
                } else if (type == "response") {
                    self.set_status(false);
                }
            }, time*1000);
        },
        send: function() {
            var self = this;
            openerp.session.rpc("/pos_longpolling/update", {message: "PING", pos_id: self.pos.config.id}).then(function(){
                self.start_timer(self.pos.config.response_timeout, "response");
            }, function(error, e){
                e.preventDefault();
                self.set_status(false);
            });
        },
    });

    module.StatusWidget.include({
        set_poll_status: function(status) {
            var element = this.$('.js_poll_connected');
            if (status) {
                element.removeClass('oe_red');
                element.addClass('oe_green');
            } else {
                element.removeClass('oe_green');
                element.addClass('oe_red');
            }
        }
    });

    module.SynchNotificationWidget.include({
        start: function(){
            this._super();
            var self = this;
            this.pos.longpolling_connection.on("change:poll_connection", function(status){
                self.set_poll_status(status);
            });
        },
    });
};
