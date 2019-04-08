odoo.define('pos_longpolling', function(require){

    var exports = {};

    var Backbone = window.Backbone;
    var session = require('web.session');
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var bus = require('bus.bus');
    var chrome = require('point_of_sale.chrome');
    var crash_manager = require('web.crash_manager');
    var QWeb = core.qweb;
    var _t = core._t;

    // prevent bus to be started by chat_manager.js
    bus.ERROR_DELAY = 10000;
    // fake value to ignore start_polling call
    bus.bus.activated = true;

    bus.Bus.include({
        init_bus: function(pos, sync_server){
            this.pos = pos;
            if (!this.channel_callbacks){
                this.channel_callbacks = {};
            }
            this.ERROR_DELAY = 10000;
            this.serv_adr = sync_server || '';
            this.longpolling_connection = new exports.LongpollingConnection(this.pos, this);
            this.set_activated(false);
            var callback = this.longpolling_connection.network_is_on;
            this.add_channel_callback("pos.longpolling", callback, this.longpolling_connection);
        },
        poll: function(address) {
            var self = this;
            this.set_activated(true);
            var now = new Date().getTime();
            var options = _.extend({}, this.options, {
                bus_inactivity: now - this.get_last_presence(),
            });
            var data = {channels: this.channels, last: this.last, options: options};
            // function is copy-pasted from bus.js but the line below defines a custom server address
            var serv_adr = address
                ? address.serv
                : this.serv_adr || '';
            session.rpc(serv_adr + '/longpolling/poll', data, {shadow : true, timeout: 60000}).then(function(result) {
                self.on_notification(result);
                if(!self.stop){
                    self.poll();
                }
                //difference with original
                var poll_connection = self.longpolling_connection;
                poll_connection.set_waiting_poll_response(false);
                poll_connection.network_is_on();
            }, function(unused, e) {
                //difference with original
                self.longpolling_connection.network_is_off();
                // no error popup if request is interrupted or fails for any reason
                e.preventDefault();
                // random delay to avoid massive longpolling
                setTimeout(_.bind(self.poll, self), bus.ERROR_DELAY + (Math.floor((Math.random()*20)+1)*1000));
            });
        },
        check_sleep_mode: function() {
            var hidden = '';
            var visibilityChange = '';
            var self = this;

            function onVisibilityChange() {
                self.sleep = true;
            }

            if (typeof document.hidden !== 'undefined') {
                hidden = 'hidden';
                visibilityChange = 'visibilitychange';
            } else if (typeof document.mozHidden !== 'undefined') {
                hidden = 'mozHidden';
                visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.msHidden !== 'undefined') {
                hidden = 'msHidden';
                visibilityChange = 'msvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                hidden = 'webkitHidden';
                visibilityChange = 'webkitvisibilitychange';
            }

            if (visibilityChange !== undefined) {
                document.addEventListener(visibilityChange, onVisibilityChange, false);
            }
        },
        add_channel_callback: function(channel_name, callback, thisArg) {
            if (thisArg){
                callback = _.bind(callback, thisArg);
            }
            if (!this.channel_callbacks){
                this.channel_callbacks = {};
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
            this.lonpolling_activated = true;
            this.longpolling_connection.send_ping({serv: this.serv_adr});
            // one tab per browser is_master but we need to be able to poll with several tabs with odoo opened
            // https://github.com/odoo/odoo/blob/10.0/addons/bus/static/src/js/bus.js#L134
            var is_master = this.is_master;
            this.is_master = true;
            this.start_polling();
            this.is_master = is_master;

            this.set_activated(true);
            this.check_sleep_mode();
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
                channel = JSON.parse(channel);
            }
            if(Array.isArray(channel) && (channel[1] in self.channel_callbacks)){
                try{
                    var callback = self.channel_callbacks[channel[1]];
                    if (callback) {
                        if (self.pos.debug){
                            console.log('POS LONGPOLLING', self.name, self.pos.config.name, channel[1], JSON.stringify(message));
                        }
                        return callback(message);
                    }
                }catch(err){
                    crash_manager.show_error({
                        type: _t("Longpolling Handling Error"),
                        message: _t("Longpolling Handling Error"),
                        data: {debug: err.stack},
                    });
                }
            }
        },
        get_full_channel_name: function(channel_name){
            return JSON.stringify([session.db,channel_name,String(this.pos.config.id)]);
        },
        set_activated: function(is_online) {
            if (this.activated === is_online) {
                return;
            }
            this.activated = is_online;
            this.longpolling_connection.set_is_online(is_online);
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
                if (self.config.autostart_longpolling){
                    self.bus.start();
                }
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
            }
            return this.bus;
        },
    });
    exports.LongpollingConnection = Backbone.Model.extend({
        initialize: function(pos, bus) {
            this.pos = pos;
            this.timer = false;
            this.is_online = true;
            this.bus = bus;
            // Is the message "PONG" received from the server
            this.response_status = false;
            this.set_waiting_poll_response(true);
        },
        network_is_on: function(message) {
            if (message) {
                this.response_status = true;
            }
            this.update_timer();
            this.set_is_online(true);
            this.bus.sleep = false;
        },
        network_is_off: function() {
            this.update_timer();
            this.set_waiting_poll_response(true);
            this.set_is_online(false);
        },
        set_is_online: function(is_online) {
            if (this.is_online === is_online) {
                return;
            }
            this.is_online = is_online;
            this.trigger("change:poll_connection", is_online);
        },
        set_waiting_poll_response: function(status) {
            if (this.waiting_poll_response === status) {
                return;
            }
            this.waiting_poll_response = status;
            this.trigger("change:poll_response", status);
        },
        update_timer: function(){
            this.stop_timer();
            this.start_timer(this.pos.config.longpolling_max_silence_timeout, 'query');
        },
        stop_timer: function(){
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = false;
            }
        },
        start_timer: function(time, type){
            var self = this;
            this.timer = setTimeout(function() {
                if (type === "query") {
                    self.send_ping();
                } else if (type === "response") {
                    if (self.pos.debug){
                        console.log('POS LONGPOLLING start_timer error', self.bus.name, self.pos.config.name);
                    }
                    self.network_is_off();
                }
            }, time * 1000);
        },
        response_timer: function() {
            this.stop_timer();
            this.start_timer(this.pos.config.longpolling_pong_timeout, "response");
        },
        send_ping: function(address) {
            var self = this;
            this.response_status = false;
            var serv_adr = address
                ? address.serv
                : this.pos.config.sync_server || '';
            if (self.pos.debug){
                console.log('POS LONGPOLLING', self.bus.name, self.pos.config.name, "PING");
            }
            return session.rpc(serv_adr + "/pos_longpolling/update", {message: "PING", pos_id: self.pos.config.id, db_name: session.db},{timeout:30000}).then(function(){
                /* If the value "response_status" is true, then the poll message came earlier
                 if the value is false you need to start the response timer*/
                self.set_is_online(true);
                if (!self.response_status) {
                    self.response_timer();
                }
            }, function(error, e){
                e.preventDefault();
                if (self.pos.debug){
                    console.log('POS LONGPOLLING send error', self.bus.name, self.pos.config.name);
                }
                self.network_is_off();
            });
        }
    });

    var Status_Widget = chrome.StatusWidget;
    Status_Widget.include({
        rerender_poll_status: function(current_bus) {
            var element = this.$el.find('div[bid="' + current_bus.bus_id + '"]');
            if (current_bus.activated) {
                if (current_bus.longpolling_connection.is_online) {
                    if (current_bus.longpolling_connection.waiting_poll_response){
                        this.set_icon_class(element, 'oe_orange');
                    } else {
                        this.set_icon_class(element, 'oe_green');
                    }
                } else {
                    this.set_icon_class(element, 'oe_red');
                }
            } else {
                this.set_icon_class(element, 'oe_hidden');
            }
        },
        set_icon_class: function(element, new_class) {
            element.removeClass('oe_hidden oe_red oe_green oe_orange').addClass(new_class);
        },
        icon_rotating: function(element, status){
            element.find('i').removeClass('fa-spin');
            if (status){
                element.find('i').addClass('fa-spin');
            }
        },
    });


    chrome.SynchNotificationWidget.include({
        start: function(){
            this._super();
            var self = this;
            var element = this.$el.find('.serv_primary');
            var bus_id = this.pos.bus.bus_id;
            this.start_bus(this.pos.bus, element);
            this.start_additional_buses();
        },
        start_bus: function(bus, element){
            var self = this;
            element.attr('bid', bus.bus_id);
            this.rerender_poll_status(bus);
            bus.longpolling_connection.on("change:poll_connection change:poll_response", function(is_online){
                self.rerender_poll_status(bus);
            });
            element.on('click', function(event){
                self.icon_rotating(element, true);
                bus.longpolling_connection.send_ping({'serv': bus.serv_adr}).always(function(){
                    self.icon_rotating(element, false);
                });
            });
        },
        start_additional_buses: function(){
            var self = this;
            var sync_icon = QWeb.render('synch_icon', {});
            var div = false;
            _.each(this.pos.buses, function(b){
                div = document.createElement('div');
                div.innerHTML = sync_icon;
                var element = $(div);
                element.addClass('js_poll_connected oe_icon oe_green');
                self.$el.append(div);
                self.start_bus(b, element);
            });
        },
    });

    return exports;
});
