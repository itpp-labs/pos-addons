odoo.define("pos_longpolling.chrome", function(require) {
    "use strict";

    var core = require("web.core");
    var chrome = require("point_of_sale.chrome");
    var QWeb = core.qweb;

    chrome.StatusWidget.include({
        rerender_poll_status: function(current_bus) {
            var element = this.$el.find('div[bid="' + current_bus.bus._id + '"]');
            if (current_bus.bus._isActive) {
                if (current_bus.longpolling_connection.is_online) {
                    if (current_bus.longpolling_connection.waiting_poll_response) {
                        this.set_icon_class(element, "oe_orange");
                    } else {
                        this.set_icon_class(element, "oe_green");
                    }
                } else {
                    this.set_icon_class(element, "oe_red");
                }
            } else {
                this.set_icon_class(element, "oe_hidden");
            }
        },
        set_icon_class: function(element, new_class) {
            element
                .removeClass("oe_hidden oe_red oe_green oe_orange")
                .addClass(new_class);
        },
        icon_rotating: function(element, status) {
            element.find("i").removeClass("fa-spin");
            if (status) {
                element.find("i").addClass("fa-spin");
            }
        },
    });

    chrome.SynchNotificationWidget.include({
        start: function() {
            this._super();
            var element = this.$el.find(".serv_primary");
            this.start_bus(this.pos.bus, element);
            this.start_additional_buses();
        },
        start_bus: function(bus, element) {
            var self = this;
            element.attr("bid", bus.bus._id);
            this.rerender_poll_status(bus);
            bus.longpolling_connection.on(
                "change:poll_connection change:poll_response",
                function() {
                    self.rerender_poll_status(bus);
                }
            );
            element.on("click", function(event) {
                self.icon_rotating(element, true);
                bus.longpolling_connection
                    .send_ping({serv: bus.route})
                    .always(function() {
                        self.icon_rotating(element, false);
                    });
            });
        },
        start_additional_buses: function() {
            var self = this;
            var sync_icon = QWeb.render("synch_icon", {});
            var div = false;
            _.each(this.pos.buses, function(b) {
                div = document.createElement("div");
                div.innerHTML = sync_icon;
                var element = $(div);
                element.addClass("js_poll_connected oe_icon oe_green");
                self.$el.append(div);
                self.start_bus(b, element);
            });
        },
    });

    return chrome;
});
