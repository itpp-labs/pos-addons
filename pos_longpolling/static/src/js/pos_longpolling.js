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
};
