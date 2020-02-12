odoo.define("pos_order_print_check.multiprint", function(require) {
    "use strict";

    var Printer = require("pos_restaurant.base");

    Printer.include({
        check_connection: function() {
            var self = this;
            var done = new $.Deferred();
            if (this.config.network_printer) {
                var printers = window.posmodel.proxy.old_network_printer_status;
                var printer = printers.find(function(p) {
                    return p.ip === self.config.proxy_ip;
                });
                if (printer && printer.status === "online") {
                    done.resolve();
                } else {
                    done.reject();
                }
            } else {
                $.ajax({
                    url: this.connection.server + "/hw_proxy/hello",
                    method: "GET",
                    timeout: 1000,
                })
                    .done(function() {
                        done.resolve();
                    })
                    .fail(function() {
                        done.reject();
                    });
            }
            return done;
        },
    });

    return Printer;
});
