odoo.define('pos_longpolling', function(require){
    var exports = {};

    var session = require('web.session');
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');
    var chrome = require('point_of_sale.chrome');

    var _t = core._t;

    // prevent bus to be started by chat_manager.js
    bus.bus.activated = true; // fake value to ignore start_polling call

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.channels = {};
            this.activeted_lonpolling = false;
            this.bus = bus.bus;
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
            this.activeted_lonpolling = true;
        },
        add_channel: function(channel_name, callback) {
            var self = this;
            this.channels[channel_name] = callback;
            if (this.activeted_lonpolling) {
                self.init_channel(channel_name)
            }
        },
        init_channel: function(channel_name){
            var self = this;
            var channel = JSON.stringify([session.db,channel_name,String(self.config.id)]);
            this.bus.add_channel(channel);
        },
        remove_channel: function(channel_name) {
            var self = this;
            if (channel_name in self.channels) {
                delete self.channels[channel_name];
            }
        },
        on_notification: function(notification) {
            var self = this;
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
                    this.chrome.gui.show_popup('error',{
                        'title': _t('Error'),
                        'body': err,
                    });
                }
            }
        }
    });
});
