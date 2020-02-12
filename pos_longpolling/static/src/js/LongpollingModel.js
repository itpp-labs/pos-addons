odoo.define("pos_longpolling.LongpollingModel", function(require) {
    "use strict";

    var Backbone = window.Backbone;
    var session = require("web.session");

    var LongpollingModel = Backbone.Model.extend({
        initialize: function(pos, bus) {
            this.pos = pos;
            this.timer = false;
            this.is_online = false;
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
        update_timer: function() {
            this.stop_timer();
            this.start_timer(this.pos.config.longpolling_max_silence_timeout, "query");
        },
        stop_timer: function() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = false;
            }
        },
        start_timer: function(time, type) {
            var self = this;
            this.timer = setTimeout(function() {
                if (type === "query") {
                    self.send_ping();
                } else if (type === "response") {
                    if (self.pos.debug) {
                        console.log(
                            "POS LONGPOLLING start_timer error",
                            self.bus.service,
                            self.pos.config.name
                        );
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
            var serv_adr = this.pos.config.sync_server || "";
            if (address) {
                serv_adr = address.serv;
            }
            if (self.pos.debug) {
                console.log(
                    "POS LONGPOLLING",
                    self.bus.service,
                    self.pos.config.name,
                    "PING"
                );
            }
            return session
                .rpc(
                    serv_adr + "/pos_longpolling/update",
                    {message: "PING", pos_id: self.pos.config.id, db_name: session.db},
                    {timeout: 30000}
                )
                .then(
                    function() {
                        /* If the value "response_status" is true, then the poll message came earlier
                 if the value is false you need to start the response timer*/
                        self.set_is_online(true);
                        if (!self.response_status) {
                            self.response_timer();
                        }
                    },
                    function(error, e) {
                        e.preventDefault();
                        if (self.pos.debug) {
                            console.log(
                                "POS LONGPOLLING send error",
                                self.bus.service,
                                self.pos.config.name
                            );
                        }
                        self.network_is_off();
                    }
                );
        },
    });

    return LongpollingModel;
});
