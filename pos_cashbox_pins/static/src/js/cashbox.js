/* Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73>
 * License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_cashbox_pins.open", function(require) {
    "use strict";

    var Session = require("web.Session");
    var screens = require("point_of_sale.screens");
    var rpc = require("web.rpc");

    screens.PaymentScreenWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            options = options || {};
            var url = this.gui.pos.config.proxy_ip;
            var protocol = window.location.protocol;
            var port = ":8069";
            if (protocol === "https:") {
                port = ":443";
            }
            if (url.indexOf("//") < 0) {
                url = protocol + "//" + url;
            }
            if (url.indexOf(":", 5) < 0) {
                url += port;
            }
            console.log(url);
            this.connection = new Session(undefined, url, {use_cors: true});
        },
        renderElement: function() {
            var self = this;
            this._super();
            this.$(".js_cashdrawer_1").click(function() {
                self.pin_2();
            });
            this.$(".js_cashdrawer_2").click(function() {
                self.pin_5();
            });
            return self.connection
                .rpc("/hw_proxy/get_stat", {}, {timeout: 2500})
                .then(function(res) {
                    console.log(res);
                    console.log("========================status===================");
                });
        },

        pin_2: function() {
            var self = this;
            rpc.query({
                model: "res.users",
                method: "read",
                args: [[1], ["pos_security_pin"]],
            }).then(function(admin) {
                return self.gui
                    .ask_password(admin[0].pos_security_pin)
                    .then(function(result) {
                        return self.connection
                            .rpc("/hw_proxy/open_cashbox_pin2", {}, {timeout: 2500})
                            .then(function(res) {
                                console.log(self.gui.pos.config.proxy_ip);
                                console.log(
                                    "========================open_cashbox_pin2==================="
                                );
                            });
                    });
            });
        },

        pin_5: function() {
            var self = this;
            var cashier = this.pos.get_cashier();
            return this.gui
                .ask_password(cashier.pos_security_pin)
                .then(function(result) {
                    return self.connection
                        .rpc("/hw_proxy/open_cashbox_pin5", {}, {timeout: 2500})
                        .then(function(res) {
                            console.log(self.gui.pos.config.proxy_ip);
                            console.log(
                                "========================open_cashbox_pin5========================"
                            );
                        });
                });
        },
    });
});
