odoo.define("pos_longpolling.SyncBusService", function(require) {
    "use strict";

    var BusService = require("bus.BusService");

    var SyncBusService = BusService.extend({
        _isActive: true,
        addPollRoute: function(url) {
            if (url) {
                this.POLL_ROUTE = url + this.POLL_ROUTE;
            }
        },
    });

    return SyncBusService;
});
