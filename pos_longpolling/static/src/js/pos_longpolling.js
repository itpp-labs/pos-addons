odoo.define('pos_longpolling', function(require){

    var exports = {};

    var Backbone = window.Backbone;
    var session = require('web.session');
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');
    var chrome = require('point_of_sale.chrome');

    var _t = core._t;

    // prevent bus to be started by chat_manager.js
    // fake value to ignore start_polling call
    bus.bus.activated = true;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.channels = {};
            this.lonpolling_activated = false;
            this.bus = bus.bus;
            this.longpolling_connection = new exports.LongpollingConnection(this);
            var channel_name = "pos.longpolling";
            var callback = this.longpolling_connection.network_is_on;
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
            var current_callback = callback;
            if (thisArg){
                current_callback = _.bind(callback, thisArg);
            }
            this.channels[channel_name] = current_callback;
            if (this.lonpolling_activated) {
                this.init_channel(channel_name);
            }
        },
        get_full_channel_name: function(channel_name){
            return JSON.stringify([session.db,channel_name,String(this.config.id)]);
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
            for (var i = 0; i < notification.length; i++) {
                var channel = notification[i][0];
                var message = notification[i][1];
                this.on_notification_do(channel, message);
            }
            this.db.save('bus_last', this.bus.last);
        },
        on_notification_do: function (channel, message) {
            var self = this;
            if (_.isString(channel)){
                var current_channel = JSON.parse(channel);
            }
            if(Array.isArray(current_channel) && current_channel[1] in self.channels){
                try{
                    self.longpolling_connection.network_is_on();
                    var callback = self.channels[current_channel[1]];
                    if (callback) {
                        if (self.debug){
                            console.log('POS LONGPOLLING', self.config.name, current_channel[1], JSON.stringify(message));
                        }
                        return callback(message);
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
    exports.LongpollingConnection = Backbone.Model.extend({
        initialize: function(pos) {
            this.pos = pos;
            this.timer = false;
            this.status = false;
            // Is the message "PONG" received from the server
            this.response_status = false;
        },
        network_is_on: function(message) {
            if (message) {
                this.response_status = true;
            }
            this.update_timer();
            this.set_status(true);
        },
        network_is_off: function() {
            this.update_timer();
            this.set_status(false);
        },
        set_status: function(status) {
            if (this.status === status) {
                return;
            }
            this.status = status;
            this.trigger("change:poll_connection", status);
        },
        update_timer: function(){
            this.stop_timer();
            this.start_timer(this.pos.config.query_timeout, 'query');
        },
        stop_timer: function(){
            var self = this;
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = false;
            }
        },
        start_timer: function(time, type){
            var response_time = Math.round(time * 3600.0);
            var self = this;
            this.timer = setTimeout(function() {
                if (type === "query") {
                    self.send();
                } else if (type === "response") {
                    self.network_is_off();
                }
            }, response_time * 1000);
        },
        response_timer: function() {
            this.stop_timer();
            this.start_timer(this.pos.config.response_timeout, "response");
        },
        send: function() {
            var self = this;
            this.response_status = false;
            openerp.session.rpc("/pos_longpolling/update", {message: "PING", pos_id: self.pos.config.id}).then(function(){
                /* If the value "response_status" is true, then the poll message came earlier
                 if the value is false you need to start the response timer*/
                if (!self.response_status) {
                    self.response_timer();
                }
            }, function(error, e){
                e.preventDefault();
                self.network_is_off();
            });
        }
    });
    chrome.StatusWidget.include({
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
    chrome.SynchNotificationWidget.include({
        start: function(){
            this._super();
            var self = this;
            this.pos.longpolling_connection.on("change:poll_connection", function(status){
                self.set_poll_status(status);
            });
        },
    });
    return exports;
});
