odoo.define('pos_longpolling', function(require){

    var exports = {};

    var Backbone = window.Backbone;
    var session = require('web.session');
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');
    var chrome = require('point_of_sale.chrome');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;

    // prevent bus to be started by chat_manager.js
    bus.bus.activated = true; // fake value to ignore start_polling call
    bus.ERROR_DELAY = 10000;

    bus.Bus.include({
        init_bus: function(pos, sync_server){
            this.pos = pos;
            if (!this.channel_callbacks){
                this.channel_callbacks = {};
            }
            this.serv_adr = sync_server || '';
            this.longpolling_connection = new exports.LongpollingConnection(this.pos);
            this.activated = false;
//            if (this != this.pos.bus){
//                this.create_icon();
//            }
        },
//        create_icon: function(){
//            var additional_refresh_icon = QWeb.render('synch_icon');
//            var div = document.createElement('div');
//            div.className = "js_poll_connected oe_icon oe_red serv_additional_" + this.bus_id;
//            div.innerHTML = additional_refresh_icon;
//            this.$('.js_synch').append(div);
////            this.trigger("change:poll_connection", false);
//        },
        poll: function() {
            var self = this;
            self.activated = true;
            var now = new Date().getTime();
            var options = _.extend({}, this.options, {
                bus_inactivity: now - this.get_last_presence(),
            });
            var data = {channels: self.channels, last: self.last, options: options};
            // function is copy-pasted from bus.js but the line below defines a custom server address
            session.rpc(this.serv_adr + '/longpolling/poll', data, {shadow : true}).then(function(result) {
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
        add_channel_callback: function(channel_name, callback, thisArg) {
            if (thisArg){
                callback = _.bind(callback, thisArg);
            }
            this.channel_callbacks[channel_name] = callback;
            if (this.lonpolling_activated) {
                this.activate_channel(channel_name);
            }
        },
        remove_channel: function(channel_name) {
            if (channel_name in this.channels) {
                delete this.channels[channel_name];
                var channel = this.get_full_channel_name(channel_name);
                this.delete_channel(channel);
            }
        },
        start: function(){
            if (this.activated){
                return;
            }
            var self = this;
            this.last = this.pos.db.load(this.bus_id_last(), 0);
            this.on("notification", this, this.on_notification_callback);
            this.stop_polling();
            _.each(self.channel_callbacks, function(value, key){
                self.activate_channel(key);
            });
            this.start_polling();
            this.lonpolling_activated = true;
            this.longpolling_connection.send();
            this.activated = true;
        },
        activate_channel: function(channel_name){
            var channel = this.get_full_channel_name(channel_name);
            this.add_channel(channel);
        },
        on_notification_callback: function(notification) {
            for (var i = 0; i < notification.length; i++) {
                var channel = notification[i][0];
                var message = notification[i][1];
                this.on_notification_do(channel, message);
            }
            this.pos.db.save(this.bus_id_last(), this.last);
        },
        bus_id_last: function () {
            return 'bus_' + this.bus_id + 'last';
        },
        on_notification_do: function (channel, message) {
            var self = this;
            if (_.isString(channel)) {
                var channel = JSON.parse(channel);
            }
            if(Array.isArray(channel) && (channel[1] in self.channel_callbacks)){
                try{
                    self.longpolling_connection.network_is_on();
                    var callback = self.channel_callbacks[channel[1]];
                    if (callback) {
                        if (self.pos.debug){
                            console.log('POS LONGPOLLING', self.name, self.pos.config.name, channel[1], JSON.stringify(message));
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
        },
        get_full_channel_name: function(channel_name){
            return JSON.stringify([session.db,channel_name,String(this.pos.config.id)]);
        },
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.buses = {};
            this.bus = bus.bus;
            this.bus.lonpolling_activated = false;
            this.bus.name = 'Default';
            this.ready.then(function () {
                self.bus.init_bus(self);
                var callback = self.bus.longpolling_connection.network_is_on;
                self.bus.add_channel_callback("pos.longpolling", callback, self.bus.longpolling_connection);
                if (self.config.autostart_longpolling){
                    self.bus.start();
                };
            });
        },
        add_bus: function(key, sync_server){
            this.buses[key] = new bus.Bus();
            this.buses[key].init_bus(this, sync_server);
            this.buses[key].name = key;
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
            var serv_adr = '';
            if (this.pos.config.sync_server){
                var serv_adr = this.pos.config.sync_server || '';
            };
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
        set_poll_status: function(element, bus) {
            if (bus.longpolling_connection.status) {
                element.removeClass('oe_red');
                element.addClass('oe_green');
            } else {
                element.removeClass('oe_green');
                element.addClass('oe_red');
            }
        },
    });

    chrome.SynchNotificationWidget.include({
        start: function(){
            this._super();
            var self = this;
            for (var key in this.pos.buses){
                bus = this.pos.buses[key];
                var additional_refresh_icon = QWeb.render('synch_icon',{widget: this});
                var div = document.createElement('div');
                div.className = "js_poll_connected oe_icon oe_red serv_additional_" + bus.bus_id;
                div.innerHTML = additional_refresh_icon;
                this.$('.js_synch').append(div);
            };
            this.pos.bus.longpolling_connection.on("change:poll_connection", function(status){
                var element = self.$('.serv_primary');
                self.set_poll_status(element, self.pos.bus);
                var machines = Object.entries(this.pos.buses);
                machines.map(function(bus){
                    bus = bus[1]
                    var element = this.$('.serv_additional_' + bus.bus_id);
                    self.set_poll_status(element, bus);
                });
            });
            this.pos.bus.longpolling_connection.set_status(true)
        },
    });
    return exports;
});
