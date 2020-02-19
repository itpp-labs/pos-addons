odoo.define("pos_longpolling.LongpollingBus", function(require) {
    "use strict";

    var LongpollingBus = require("bus.Longpolling");

    LongpollingBus.include({
        _poll: function() {
            // Function is copy-pasted from longpolling_bus.js
            var self = this;
            if (!this._isActive) {
                return;
            }
            var now = new Date().getTime();
            var options = _.extend({}, this._options, {
                bus_inactivity: now - this._getLastPresence(),
            });
            if (
                this._lastPartnersPresenceCheck + this.PARTNERS_PRESENCE_CHECK_PERIOD >
                now
            ) {
                options = _.omit(options, "bus_presence_partner_ids");
            } else {
                this._lastPartnersPresenceCheck = now;
            }
            var data = {
                channels: this._channels,
                last: this._lastNotificationID,
                options: options,
            };
            // The backend has a maximum cycle time of 50 seconds so give +10 seconds
            this._pollRpc = this._rpc(
                {route: this.POLL_ROUTE, params: data},
                {shadow: true, timeout: 60000}
            );
            this._pollRpc.then(
                function(result) {
                    self._pollRpc = false;
                    self._onPoll(result);
                    self._poll();
                    // DIFFERENCES FROM ORIGINAL:
                    // * change connection status to online
                    var poll_connection = self.pos_longpolling;
                    poll_connection.set_waiting_poll_response(false);
                    poll_connection.network_is_on();
                },
                function(error, ev) {
                    self._pollRpc = false;
                    // DIFFERENCES FROM ORIGINAL:
                    // * change connection status to offline
                    self.pos_longpolling.network_is_off();
                    // No error popup if request is interrupted or fails for any reason
                    ev.preventDefault();
                    if (error && error.message === "XmlHttpRequestError abort") {
                        self._poll();
                    } else {
                        // Random delay to avoid massive longpolling

                        // DIFFERENCES FROM ORIGINAL:
                        // * binding of context (self) to an object
                        self._pollRetryTimeout = setTimeout(
                            self._poll.bind(self),
                            self.ERROR_RETRY_DELAY +
                                Math.floor(Math.random() * 20 + 1) * 1000
                        );
                    }
                }
            );
        },
    });

    return LongpollingBus;
});
