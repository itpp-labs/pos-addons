odoo.define("pos_employee_select.gui", function(require) {
    "use strict";

    var gui = require("pos_choosing_cashier").Gui;
    var core = require("web.core");
    var _t = core._t;

    gui.include({
        select_user: function(options) {
            options = options || {};
            if (options.employee_cashier_window) {
                var self = this;
                var def = new $.Deferred();
                var list = [];
                var current_employee_cashier = this.pos
                    .get_order()
                    .get_employee_cashier();
                _.each(this.pos.employee_cashiers, function(user) {
                    list.push({
                        label: user.name,
                        item: user,
                        selected:
                            current_employee_cashier &&
                            current_employee_cashier.id === user.id,
                    });
                });

                this.show_popup("cashier", {
                    title: options.title || _t("Select Cashier"),
                    list: list,
                    employee: true,
                    confirm: function(cashier) {
                        // Switches cashier on cashier state screen property to false on user confirmation
                        // self.pos.barcode_reader.on_cashier_screen = false;
                        def.resolve(cashier);
                    },
                    cancel: function() {
                        // Same on cancel
                        // self.pos.barcode_reader.on_cashier_screen = false;
                        def.reject();
                    },
                });

                return def.then(function(user) {
                    if (
                        options.security &&
                        user !== options.current_user &&
                        user.pos_security_pin
                    ) {
                        return self
                            .ask_password(user.pos_security_pin)
                            .then(function() {
                                return user;
                            });
                    }
                    return user;
                });
            }
            return this._super(options);
        },
    });

    return gui;
});
