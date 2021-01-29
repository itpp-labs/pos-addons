odoo.define("pos_longpolling.pos", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var PosConnection = require("pos_longpolling.PosConnection");

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function() {
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.buses = {};
            var options = {
                name: "bus_service",
                lonpolling_activated: false,
            };
            this.bus = new PosConnection(options);
            this.ready.then(function() {
                self.bus.init_bus(self);
                if (self.config.autostart_longpolling) {
                    self.bus.start();
                }
            });
        },
        add_bus: function(key, sync_server) {
            var options = {
                name: key,
                route: sync_server,
            };
            this.buses[key] = new PosConnection(options);
            this.buses[key].init_bus(this);
        },
        get_bus: function(key) {
            if (key) {
                return this.buses[key];
            }
            return this.bus;
        },
    });

    return models;
});
