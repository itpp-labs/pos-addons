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
    bus.bus.activated = true; // fake value to ignore start_polling call
    var PARTNERS_PRESENCE_CHECK_PERIOD = 30000;  // don't check presence more than once every 30s
    bus.ERROR_DELAY = 10000;

    bus.Bus.include({
        init_bus: function(pos){
            this.pos = pos;
            this.pos.channels = {};
            this.longpolling_connection = new exports.LongpollingConnection(this.pos);
            var callback = this.longpolling_connection.network_is_on;
            var channel_name = "pos.longpolling";
            this.add_channel_callback(channel_name, callback, this.longpolling_connection);
        },
        poll: function() {
            var self = this;
            self.activated = true;
            var now = new Date().getTime();
            var options = _.extend({}, this.options, {
                bus_inactivity: now - this.get_last_presence(),
            });
            if (this.last_partners_presence_check + PARTNERS_PRESENCE_CHECK_PERIOD > now) {
                options = _.omit(options, 'bus_presence_partner_ids');
            } else {
                this.last_partners_presence_check = now;
            }
            var data = {channels: self.channels, last: self.last, options: options};
            //new added lines for modifying url
            var serv_adr = '';
            if (session.longpolling_server){
                var serv_adr = session.longpolling_server;
            };
            //---------------------------------------------
            session.rpc(serv_adr + '/longpolling/poll', data, {shadow : true}).then(function(result) {
                self.on_notification(result);
                if(!self.stop){
                    self.poll();
                }
            }, function(unused, e) {
                // no error popup if request is interrupted or fails for any reason
                e.preventDefault();
                // random delay to avoid massive longpolling
                setTimeout(_.bind(self.poll, self), bus.ERROR_DELAY + (Math.floor((Math.random()*20)+1)*1000));
            });
        },
        on_notification: function(notifications) {
            var self = this;
            var notifs = _.map(notifications, function (notif) {
                if (notif.id > self.last) {
                    self.last = notif.id;
                }
                return [notif.channel, notif.message];
            });
            this.trigger("notification", notifs);
        },
        add_channel_callback: function(channel_name, callback, thisArg) {
            if (thisArg){
                callback = _.bind(callback, thisArg);
            }
            this.pos.channels[channel_name] = callback;
            if (this.pos.lonpolling_activated) {
                this.init_channel(channel_name);
            }
        },
        remove_channel_callback: function(channel_name) {
            if (channel_name in this.channels) {
                delete this.channels[channel_name];
                var channel = this.pos.get_full_channel_name(channel_name);
                this.delete_channel(channel);
            }
        },
        start: function(){
            var self = this;
            this.last = this.pos.db.load('bus_last', 0);
            this.on("notification", this, this.on_notification_callback);
            this.stop_polling();
            _.each(self.pos.channels, function(value, key){
                self.init_channel(key);
            });
            this.start_polling();
            this.pos.lonpolling_activated = true;
            this.longpolling_connection.send();
        },

        init_channel: function(channel_name){
            var channel = this.pos.get_full_channel_name(channel_name);
            this.add_channel(channel);
        },

        on_notification_callback: function(notification) {
            for (var i = 0; i < notification.length; i++) {
                var channel = notification[i][0];
                var message = notification[i][1];
                this.on_notification_do(channel, message);
            }
            this.pos.db.save('bus_last', this.last);
        },
        on_notification_do: function (channel, message) {
            var self = this;
            if (_.isString(channel)) {
                var channel = JSON.parse(channel);
            }
            if(Array.isArray(channel) && (channel[1] in self.pos.channels)){
                try{
                    self.longpolling_connection.network_is_on();
                    var callback = self.pos.channels[channel[1]];
                    if (callback) {
                        if (self.pos.debug){
                            console.log('POS LONGPOLLING', self.pos.config.name, channel[1], JSON.stringify(message));
                        }
                        callback(message);
                    }
                }catch(err){
                    this.pos.chrome.gui.show_popup('error',{
                        'title': _t('Error'),
                        'body': err,
                    });
                }
            }
        }
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.lonpolling_activated = false;
            this.buses = {};
            this.bus = bus.bus;
            this.bus.init_bus(this);
            this.ready.then(function () {
                if (self.config.autostart_longpolling){
                    self.bus.start();
                };
            });
        },
        get_full_channel_name: function(channel_name){
            return JSON.stringify([session.db,channel_name,String(this.config.id)]);
        },
        add_bus: function(key){
            this.buses[key] = new bus.Bus();
            this.buses[key].init_bus();
        },
        get_bus: function(key){
            if (key){
                return this.buses[key];
            } else {
                return this.bus;
            }
        },

    });
    exports.LongpollingConnection = Backbone.Model.extend({
        initialize: function(pos) {
            this.pos = pos;
            this.timer = false;
            this.status = false;
            this.response_status = false; // Is the message "PONG" received from the server
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
            if (this.status == status) {
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
            var time = Math.round(time * 3600.0);
            var self = this;
            this.timer = setTimeout(function() {
                if (type == "query") {
                    self.send();
                } else if (type == "response") {
                    if (self.pos.debug){
                        console.log('POS LONGPOLLING start_timer error', self.pos.config.name);
                    }
                    self.network_is_off();
                }
            }, time * 1000);
        },
        response_timer: function() {
            this.stop_timer();
            this.start_timer(this.pos.config.response_timeout, "response");
        },
        send: function() {
            var self = this;
            this.response_status = false;
            //new added lines for modifying url
            var serv_adr = '';
            if (session.longpolling_server){
                var serv_adr = session.longpolling_server || '';
            };
            //---------------------------------------------
            openerp.session.rpc(serv_adr + "/pos_longpolling/update", {message: "PING", pos_id: self.pos.config.id}).then(function(){
                /* If the value "response_status" is true, then the poll message came earlier
                if the value is false you need to start the response timer*/
                if (!self.response_status) {
                    self.response_timer();
                }
            }, function(error, e){
                e.preventDefault();
                if (self.pos.debug){
                    console.log('POS LONGPOLLING send error', self.pos.config.name);
                }
                self.network_is_off();
            });
        }
    });
    chrome.StatusWidget.include({
        set_poll_status: function(status) {
            var element = this.$('.js_poll_connected');
            // default sync_server = ""
            if (this.pos.config.sync_server === false){
                element.removeClass('oe_red');
                element.addClass('oe_gray');
                return;
            }
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
            this.pos.bus.longpolling_connection.on("change:poll_connection", function(status){
                self.set_poll_status(status);
            });
        },
    });

    return exports;
});
