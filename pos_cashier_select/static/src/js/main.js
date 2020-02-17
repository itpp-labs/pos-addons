/*  Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
    Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73/>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_choosing_cashier", function(require) {
    "use strict";

    var ActionpadWidget = require("point_of_sale.screens").ActionpadWidget;
    var core = require("web.core");
    var BarcodeReader = require("point_of_sale.devices").BarcodeReader;
    var PopupWidget = require("point_of_sale.popups");
    var ScreenWidget = require("point_of_sale.screens").ScreenWidget;
    var Gui = require("point_of_sale.gui").Gui;
    var gui = require("point_of_sale.gui");

    var _t = core._t;

    var CashierSelectionPopupWidget = PopupWidget.extend({
        template: "CashierSelectionPopupWidget",
        show: function(options) {
            options = options || {};
            this._super(options);

            this.list = options.list || [];
            this.renderElement();
        },
        click_item: function(event) {
            this.gui.close_popup();
            if (this.options.confirm) {
                var item = this.list[parseInt($(event.target).data("item-index"), 10)];
                item = item ? item.item : item;
                this.options.confirm.call(self, item);
            }
        },
    });

    gui.define_popup({name: "cashier", widget: CashierSelectionPopupWidget});

    BarcodeReader.include({
        init: function(attributes) {
            this._super(attributes);
            this.on_cashier_screen = false;
        },

        scan: function(code) {
            if (!code) {
                return;
            }
            var parsed_result = this.barcode_parser.parse_barcode(code);
            // Blocks barcodes on cashier select window besides cases when barcode's type is 'cashier'
            if (this.on_cashier_screen && parsed_result.type !== "cashier") {
                console.warn("Ignored Barcode Scan:", parsed_result);
                return;
            }
            this._super(code);
        },
    });

    ActionpadWidget.include({
        renderElement: function() {
            var self = this;
            this._super();
            this.$(".pay").unbind();
            this.$(".pay").click(function() {
                self.show_cashier_window();
            });
            this.$(".set-customer").click(function() {
                self.gui.show_screen("clientlist");
            });
        },

        payment: function() {
            // This method has been added to encapsulate the original widget's logic
            // just to make code more clean and readable
            var self = this;
            var order = self.pos.get_order();
            var has_valid_product_lot = _.every(order.orderlines.models, function(
                line
            ) {
                return line.has_valid_product_lot();
            });
            if (has_valid_product_lot) {
                self.gui.show_screen("payment");
            } else {
                self.gui.show_popup("confirm", {
                    title: _t("Empty Serial/Lot Number"),
                    body: _t("One or more product(s) required serial/lot number."),
                    confirm: function() {
                        self.gui.show_screen("payment");
                    },
                });
            }
        },

        show_cashier_window: function() {
            var self = this;
            this.pos.barcode_reader.on_cashier_screen = true;
            return this.gui
                .select_user({
                    security: true,
                    current_user: this.pos.get_cashier(),
                    title: _t("Change Cashier"),
                    cashier_window: true,
                })
                .then(function(user) {
                    self.pos.set_cashier(user);
                    self.gui.chrome.widget.username.renderElement();
                })
                .then(function() {
                    self.payment();
                });
        },
    });

    PopupWidget.include({
        show: function(options) {
            if (this.pos.barcode_reader.on_cashier_screen) {
                if (this.$el) {
                    this.$el.removeClass("oe_hidden");
                }
                if (typeof options === "string") {
                    this.options = {title: options};
                } else {
                    this.options = options || {};
                }
                this.renderElement();
            } else {
                this._super(options);
            }
        },
    });

    ScreenWidget.include({
        barcode_cashier_action: function(code) {
            var users = this.pos.users;
            for (var i = 0, len = users.length; i < len; i++) {
                if (users[i].barcode === code.code) {
                    this.pos.set_cashier(users[i]);
                    this.chrome.widget.username.renderElement();
                    if (this.pos.barcode_reader.on_cashier_screen) {
                        this.pos.barcode_reader.on_cashier_screen = false;
                        this.gui.show_screen("payment");
                    }
                    return true;
                }
            }
            this.barcode_error_action(code);
            return false;
        },
    });

    Gui.include({
        /* This method has been redefined in order to add a trigger that allows to determine
     whether the cashiers's selection screen is active. Used to block the redirect to the payment window.
     Also allows to use a new cashier widget instead of the old select widget one */
        select_user: function(options) {
            options = options || {};
            var self = this;
            var def = new $.Deferred();

            var list = [];
            for (var i = 0; i < this.pos.users.length; i++) {
                var user = this.pos.users[i];
                if (!options.only_managers || user.role === "manager") {
                    list.push({
                        label: user.name,
                        item: user,
                    });
                }
            }
            var popup_type = options.cashier_window ? "cashier" : "selection";
            this.show_popup(popup_type, {
                title: options.title || _t("Select User"),
                list: list,
                confirm: function(_user) {
                    // Switches cashier on cashier state screen property to false on user confirmation
                    self.pos.barcode_reader.on_cashier_screen = false;
                    def.resolve(_user);
                },
                cancel: function() {
                    // Same on cancel
                    self.pos.barcode_reader.on_cashier_screen = false;
                    def.reject();
                },
            });

            return def.then(function(_user) {
                if (
                    options.security &&
                    _user !== options.current_user &&
                    _user.pos_security_pin
                ) {
                    return self.ask_password(_user.pos_security_pin).then(function() {
                        return _user;
                    });
                }
                return _user;
            });
        },
    });
});
