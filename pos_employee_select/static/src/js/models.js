odoo.define("pos_employee_select.models", function(require) {
    "use strict";

    var models = require("point_of_sale.models");

    models.load_models(
        [
            {
                model: "hr.employee",
                fields: ["name"],
                domain: function(self) {
                    var employee_cashier_ids = self.config.employee_cashier_ids;
                    if (employee_cashier_ids && employee_cashier_ids.length) {
                        return [["id", "in", employee_cashier_ids]];
                    }
                    return null;
                },
                loaded: function(self, employee_cashiers) {
                    self.employee_cashiers = employee_cashiers;
                },
            },
        ],
        {
            after: "pos.config",
        }
    );

    var OrderSuper = models.Order.prototype;
    models.Order = models.Order.extend({
        set_employee_cashier: function(employee) {
            if (
                this.get_employee_cashier() &&
                this.get_employee_cashier().id === employee.id
            ) {
                return;
            }
            this.employee_cashier = employee;
            // Save order to the local storage
            this.save_to_db();
        },
        get_employee_cashier: function() {
            return this.employee_cashier;
        },
        export_as_JSON: function() {
            var data = OrderSuper.export_as_JSON.apply(this, arguments);
            if (this.employee_cashier) {
                data.employee_cashier_id = this.employee_cashier.id;
            }
            return data;
        },
        init_from_JSON: function(json) {
            if (json.employee_cashier_id) {
                this.employee_cashier = this.pos.employee_cashiers.find(function(
                    employee
                ) {
                    return employee.id === json.employee_cashier_id;
                });
            }
            OrderSuper.init_from_JSON.call(this, json);
        },
    });

    return models;
});
