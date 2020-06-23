odoo.define("pos_employee_select.screens", function(require) {
    "use strict";

    var screens = require("point_of_sale.screens");
    var CashierSelectionPopupWidget = require("pos_choosing_cashier")
        .CashierSelectionPopupWidget;
    var core = require("web.core");
    var _t = core._t;

    screens.ActionpadWidget.include({
        show_cashier_window: function() {
            var self = this;
            var done = $.Deferred();
            this.pos.barcode_reader.on_cashier_screen = true;
            this.gui
                .select_user({
                    security: true,
                    current_user: this.pos.get_cashier(),
                    title: _t("Change Salesperson"),
                    cashier_window: true,
                })
                .then(function(user) {
                    if (user) {
                        self.pos.set_cashier(user);
                        self.gui.chrome.widget.username.renderElement();
                    }
                    self.show_employee_cashier_window().then(function() {
                        done.resolve();
                    });
                });
            return done;
        },
        show_employee_cashier_window: function() {
            var self = this;
            // This.pos.barcode_reader.on_employee_cashier_screen = true;
            return this.gui
                .select_user({
                    security: true,
                    current_user: this.pos.get_order().get_employee_cashier(),
                    title: _t("Change Cashier"),
                    employee_cashier_window: true,
                })
                .then(function(user) {
                    if (user) {
                        self.pos.get_order().set_employee_cashier(user);
                        self.gui.chrome.widget.username.renderElement();
                    }
                    self.payment();
                });
        },
    });

    CashierSelectionPopupWidget.include({
        show: function(options) {
            this._super(options);
            if (options.employee) {
                this.$(".popup-selection").addClass("employee");
            }
        },
        get_grouped_list: function() {
            var grouped_list = [];
            // Height of selection item
            var height = 50;
            this.group_size = Math.trunc(
                (this.$(".popup").height() -
                    this.$(".title").height() -
                    this.$(".footer").height() -
                    height) /
                    height
            );
            this.list = this.list || this.options.list;
            if (this.list) {
                var max_size = Math.ceil(this.list.length / 3);
                var size = this.group_size;
                if (this.list.length / size > 3) {
                    size = max_size;
                }
                for (var i = 0; i < Math.ceil(this.list.length / size); i++) {
                    grouped_list[i] = this.list.slice(i * size, i * size + size);
                }
                return grouped_list;
            }
            return [[]];
        },
        click_item: function(event) {
            this.gui.close_popup();
            var id = parseInt($(event.target).data("item-id"), 10);
            var item = this.list.find(function(user) {
                return user.item.id === id;
            });
            if (this.options.confirm) {
                item = item ? item.item : item;
                this.options.confirm.call(self, item);
            }
        },
    });

    return screens;
});
