odoo.define("pos_longpolling.PosConnection", function(require) {
    "use strict";

    var LongpollingModel = require("pos_longpolling.LongpollingModel");
    var core = require("web.core");
    var SyncBusService = require("pos_longpolling.SyncBusService");
    var crash_manager = require("web.crash_manager");
    var session = require("web.session");
    var ServiceProviderMixin = require("web.ServiceProviderMixin");
    var _t = core._t;

    var PosConnection = core.Class.extend({
        service: "bus_service",
        init: function(options) {
            options = options || {};
            this.channel_callbacks = {};
            this.route = "";
            if (options.name) {
                this.service = options.name;
            }
            if (options.lonpolling_activated) {
                this.lonpolling_activated = options.lonpolling_activated;
            }
            if (options.route) {
                // Set default service name for new route
                this.service = options.name || "sync_bus_service";
                this.route = options.route;
                core.serviceRegistry.add(this.service, SyncBusService);
                ServiceProviderMixin.services[this.service].addPollRoute(this.route);
            }
            this.bus = ServiceProviderMixin.services[this.service];
            // 1.5 seconds
            this.bus.TAB_HEARTBEAT_PERIOD = 1500;
            // Fake value (don't start a polling request)
            this.bus._isActive = true;
        },
        init_bus: function(pos) {
            this.pos = pos;
            // New longpolling connection widget
            this.longpolling_connection = new LongpollingModel(this.pos, this);
            this.bus.pos_longpolling = this.longpolling_connection;
            // Set offline state
            this.bus._isActive = null;
            this.set_activated(false);
            // Add current bus longpolling channel
            var callback = this.longpolling_connection.network_is_on;
            this.add_channel_callback(
                "pos.longpolling",
                callback,
                this.longpolling_connection
            );
        },
        start: function() {
            if (this.bus._isActive) {
                return;
            }
            var self = this;
            this.pos.chrome.call(
                this.service,
                "onNotification",
                this,
                this.on_notification_callback
            );
            this.pos.chrome.call(
                this.service,
                "stopPolling",
                this,
                this.on_notification_callback
            );
            _.each(self.channel_callbacks, function(value, key) {
                self.activate_channel(key);
            });
            var is_master = this.bus._isMasterTab;
            this.bus._isMasterTab = true;
            this.pos.chrome.call(this.service, "startPolling");
            this.bus._isMasterTab = is_master;
            // Send PING request to check connection
            this.lonpolling_activated = true;
            this.longpolling_connection.send_ping({serv: this.route});

            // This.set_activated(true);
            this.check_sleep_mode();
            // 10 seconds
            this.bus.TAB_HEARTBEAT_PERIOD = 10000;
        },
        add_channel_callback: function(channel_name, callback, thisArg) {
            if (thisArg) {
                callback = _.bind(callback, thisArg);
            }
            if (typeof this.channel_callbacks === "undefined") {
                this.channel_callbacks = {};
            }
            this.channel_callbacks[channel_name] = callback;
            if (this.lonpolling_activated) {
                this.activate_channel(channel_name);
            }
        },
        activate_channel: function(channel_name) {
            var channel = this.get_full_channel_name(channel_name);
            // Add new longpolling chanel
            this.pos.chrome.call(this.service, "addChannel", channel);
        },
        on_notification_callback: function(notification) {
            for (var i = 0; i < notification.length; i++) {
                var channel = notification[i][0];
                var message = notification[i][1];
                this.on_notification_do(channel, message);
            }
            this.pos.db.save(this.bus_id_last(), this.bus._lastNotificationID);
        },
        on_notification_do: function(channel, message) {
            var self = this;
            if (_.isString(channel)) {
                try {
                    channel = JSON.parse(channel);
                } catch (err) {
                    // Nothing to report, channel name as is
                }
            }
            if (Array.isArray(channel) && channel[1] in self.channel_callbacks) {
                try {
                    var callback = self.channel_callbacks[channel[1]];
                    if (callback) {
                        if (self.pos.debug) {
                            console.log(
                                "POS LONGPOLLING",
                                self.service,
                                self.pos.config.name,
                                channel[1],
                                JSON.stringify(message)
                            );
                        }
                        return callback(message);
                    }
                } catch (err) {
                    crash_manager.show_error({
                        type: _t("Longpolling Handling Error"),
                        message: _t("Longpolling Handling Error"),
                        data: {debug: err.stack},
                    });
                }
            }
        },
        check_sleep_mode: function() {
            var visibilityChange = "";
            var self = this;
            function onVisibilityChange() {
                self.sleep = true;
            }
            if (typeof document.hidden !== "undefined") {
                visibilityChange = "visibilitychange";
            } else if (typeof document.mozHidden !== "undefined") {
                visibilityChange = "mozvisibilitychange";
            } else if (typeof document.msHidden !== "undefined") {
                visibilityChange = "msvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                visibilityChange = "webkitvisibilitychange";
            }
            if (typeof visibilityChange !== "undefined") {
                document.addEventListener(visibilityChange, onVisibilityChange, false);
            }
        },
        get_full_channel_name: function(channel_name) {
            return JSON.stringify([
                session.db,
                channel_name,
                String(this.pos.config.id),
            ]);
        },
        bus_id_last: function() {
            return "bus_" + this.bus._id + "last";
        },
        set_activated: function(is_online) {
            if (this.bus._isActive === is_online) {
                return;
            }
            this.longpolling_connection.trigger("change:poll_connection", is_online);
        },
    });

    return PosConnection;
});
