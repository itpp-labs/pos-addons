/* eslint-disable complexity */
// complexity of set_smart_status is fixed in 11 version
odoo.define("pos_restaurant.network_printer", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var screens = require("point_of_sale.screens");
    var core = require("web.core");
    var Session = require("web.Session");
    var gui = require("point_of_sale.gui");
    var Printer = require("pos_restaurant.base");
    var devices = require("point_of_sale.devices");
    var chrome = require("point_of_sale.chrome");
    var PopupWidget = require("point_of_sale.popups");
    var QWeb = core.qweb;

    var _t = core._t;

    models.load_models({
        model: "restaurant.printer",
        fields: ["network_printer"],
        domain: null,
        loaded: function(self, printers) {
            self.printers.forEach(function(item) {
                var printer_obj = _.find(printers, function(printer) {
                    return printer.id === item.config.id;
                });
                if (printer_obj.network_printer) {
                    self.config.use_proxy = true;
                    item.config.network_printer = printer_obj.network_printer;
                    self.ready.then(function() {
                        var url = self.proxy.host;
                        if (!url) {
                            url = self.config.proxy_ip;
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
                        }
                        item.connection = new Session(undefined, url, {use_cors: true});
                    });
                }
            });
        },
    });

    Printer.include({
        print: function(receipt) {
            var self = this;
            if (this.config.network_printer) {
                var network_proxy = this.config.proxy_ip;
                if (receipt) {
                    this.receipt_queue.push(receipt);
                }
                var send_printing_job = function() {
                    if (self.receipt_queue.length > 0) {
                        var r = self.receipt_queue.shift();
                        self.connection
                            .rpc(
                                "/hw_proxy/print_xml_receipt",
                                {
                                    receipt: r,
                                    proxy: network_proxy,
                                },
                                {timeout: 5000}
                            )
                            .then(
                                function() {
                                    send_printing_job();
                                },
                                function() {
                                    self.receipt_queue.unshift(r);
                                }
                            );
                    }
                };
                send_printing_job();
            } else {
                this._super(receipt);
            }
        },
    });

    devices.ProxyDevice.include({
        init: function(parent, options) {
            this.network_printer_keptalive = false;
            this.old_network_printer_status = false;
            this._super(parent, options);
        },
        keepalive: function() {
            var self = this;
            function network_printer_status() {
                self.connection
                    .rpc("/hw_proxy/status_network_printers", {}, {timeout: 2500})
                    .then(
                        function(status) {
                            if (self.old_network_printer_status !== status) {
                                self.old_network_printer_status = status;
                                self.trigger("change:network_printer_status", status);
                            }
                        },
                        function() {
                            if (self.old_network_printer_status) {
                                self.old_network_printer_status.forEach(function(item) {
                                    item.status = "offline";
                                });
                                self.trigger(
                                    "change:network_printer_status",
                                    self.old_network_printer_status
                                );
                            }
                        }
                    )
                    .always(function() {
                        setTimeout(network_printer_status, 5000);
                    });
            }
            if (!this.network_printer_keptalive) {
                this.network_printer_keptalive = true;
                network_printer_status();
            }
            this._super();
        },
        message: function(name, params) {
            if (
                name === "print_xml_receipt" &&
                this.pos.config.receipt_printer_type === "network_printer"
            ) {
                var connection = new Session(undefined, this.pos.proxy.host, {
                    use_cors: true,
                });
                var callbacks = this.notifications[name] || [];
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](params);
                }
                params.proxy = this.pos.config.receipt_network_printer_ip;
                if (this.get("status").status !== "disconnected") {
                    return connection.rpc("/hw_proxy/" + name, params || {});
                }
                return new $.Deferred().reject();
            }
            return this._super(name, params);
        },
        try_hard_to_connect: function(current_url, options) {
            var self = this;
            var port = ":" + (options.port || "8069");
            var url = current_url;
            this.pos.receipt_printer_is_usb = true;
            if (url.indexOf("//") < 0) {
                url = "http://" + url;
            }
            if (url.indexOf(":", 5) < 0) {
                url += port;
            }
            var network_printers = this.pos.printers.filter(function(r) {
                return r.config.network_printer === true;
            });
            // Network printers are used when using receipt printers
            this.network_printers = [];
            network_printers.forEach(function(item) {
                self.network_printers.push({
                    ip: item.config.proxy_ip,
                    status: "offline",
                    name: item.config.name,
                });
            });
            if (this.pos.config.receipt_printer_type === "network_printer") {
                this.pos.receipt_printer_is_usb = false;
            }
            return this._super(url, options).done(function() {
                self.send_network_printers_to_pos_box(url, self.network_printers);
            });
        },
        send_network_printers_to_pos_box: function(url, network_printers) {
            $.ajax({
                url: url + "/hw_proxy/network_printers",
                type: "POST",
                method: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {network_printers: network_printers},
                }),
                timeout: 1000,
            });
        },
    });

    chrome.ProxyStatusWidget.include({
        start: function() {
            var self = this;
            this._super();
            // Open popup window with devices from PosBox
            $(".js_proxy").click(function() {
                self.open_printers_in_popup();
            });
            this.pos.proxy.on("change:network_printer_status", this, function(status) {
                self.set_network_printer_status(status);
            });
        },
        set_network_printer_status: function(status) {
            this.devices_status = status;
        },
        set_smart_status: function(status) {
            if (status.status === "connected") {
                var warning = false;
                var msg = "";
                if (this.pos.config.iface_scan_via_proxy) {
                    var scanner = status.drivers.scanner
                        ? status.drivers.scanner.status
                        : false;
                    if (scanner !== "connected" && scanner !== "connecting") {
                        warning = true;
                        msg += _t("Scanner");
                    }
                }
                if (this.pos.receipt_printer_is_usb) {
                    if (
                        this.pos.config.iface_print_via_proxy ||
                        this.pos.config.iface_cashdrawer
                    ) {
                        var printer = status.drivers.escpos
                            ? status.drivers.escpos.status
                            : false;
                        if (printer !== "connected" && printer !== "connecting") {
                            warning = true;
                            this.usb_printer_status = false;
                        } else {
                            this.usb_printer_status = true;
                        }
                    }
                } else if (this.pos.config.receipt_printer_type === "usb_printer") {
                    warning = true;
                    this.usb_printer_status = false;
                }
                if (this.pos.config.iface_electronic_scale) {
                    var scale = status.drivers.scale
                        ? status.drivers.scale.status
                        : false;
                    if (scale !== "connected" && scale !== "connecting") {
                        warning = true;
                        msg = msg ? msg + " & " : msg;
                        msg += _t("Scale");
                    }
                }
                if (this.devices_status && this.devices_status.length) {
                    var offline_network_printer = this.devices_status.find(function(p) {
                        return p.status === "offline";
                    });
                    if (offline_network_printer) {
                        warning = true;
                    }
                }
                msg = msg ? msg + " " + _t("Offline") : msg;
                this.set_status(warning ? "warning" : "connected", msg);
            } else {
                this._super(status);
            }
        },
        open_printers_in_popup: function() {
            var self = this;
            // If exist network printer then open popup
            var network_printer = this.pos.printers.find(function(printer) {
                return printer.config.network_printer === true;
            });
            // Show current POS printers only
            var printers = [];
            if (this.devices_status && this.devices_status.length) {
                this.pos.printers.forEach(function(printer) {
                    var exist_printer = self.devices_status.find(function(device) {
                        return printer.config.proxy_ip === device.ip;
                    });
                    if (exist_printer) {
                        printers.push(exist_printer);
                    }
                });
            }
            if (
                this.pos.config.receipt_printer_type === "network_printer" ||
                network_printer
            ) {
                this.gui.show_popup("proxy_printers", {
                    title: "Printers",
                    value: printers,
                    usb_status: this.usb_printer_status,
                });
            }
        },
    });

    var ProxyPrintersPopupWidget = PopupWidget.extend({
        template: "ProxyPrintersPopupWidget",
        init: function(parent, options) {
            this._super(parent, options);
            this.printer_cache = new screens.DomCache();
            this.usb_printer_cache = new screens.DomCache();
        },
        show: function(options) {
            options = options || {};
            this._super(options);
            this.devices_status = options.value;
            this.usb_status = options.usb_status;
            var network_printers = false;

            // Online network printers
            if (this.devices_status) {
                network_printers = this.devices_status;
            }
            // Usb printer
            if (this.pos.receipt_printer_is_usb) {
                if (this.usb_status) {
                    this.usb_printer_status = [{status: "online"}];
                } else {
                    this.usb_printer_status = [{status: "offline"}];
                }
            } else if (this.pos.config.receipt_printer_type === "usb_printer") {
                this.usb_printer_status = [{status: "offline"}];
            } else {
                this.usb_printer_status = false;
            }
            this.renderElement();
            this.render_network_list(network_printers);
            if (this.usb_printer_status) {
                this.render_usb_list(this.usb_printer_status);
            }
        },
        get_usb_printer_status: function() {
            return this.pos.receipt_printer_is_usb;
        },
        render_network_list: function(network_printers) {
            var network_contents = this.$el[0].querySelector(
                ".network-printers-list-contents"
            );
            network_contents.innerHTML = "";
            for (
                var i = 0, len = Math.min(network_printers.length, 1000);
                i < len;
                i++
            ) {
                var printer = network_printers[i];
                var printerline_html = QWeb.render("NetworkPrinterLine", {
                    widget: this,
                    printer: printer,
                });
                var printerline = document.createElement("tbody");
                printerline.innerHTML = printerline_html;
                printerline = printerline.childNodes[1];
                printerline.classList.remove("highlight");
                network_contents.appendChild(printerline);
            }
        },
        render_usb_list: function(usb_printers) {
            var usb_contents = this.$el[0].querySelector(".usb-printers-list-contents");
            usb_contents.innerHTML = "";
            for (var i = 0, len = Math.min(1, 1000); i < len; i++) {
                var printer = usb_printers[i];
                var printerline = this.usb_printer_cache.get_node(1);
                if (!printerline) {
                    var printerline_html = QWeb.render("USBPrinterLine", {
                        widget: this,
                        printer: printer,
                    });
                    printerline = document.createElement("tbody");
                    printerline.innerHTML = printerline_html;
                    printerline = printerline.childNodes[1];
                    this.usb_printer_cache.cache_node(1, printerline);
                }
                printerline.classList.remove("highlight");
                usb_contents.appendChild(printerline);
            }
        },
    });
    gui.define_popup({name: "proxy_printers", widget: ProxyPrintersPopupWidget});
});
