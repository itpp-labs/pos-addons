/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_receipt_custom_template.models", function(require) {
    "use strict";
    var models = require("point_of_sale.models");
    var core = require("web.core");

    var _t = core._t;
    var Qweb = core.qweb;

    models.load_models({
        model: "pos.custom_receipt",
        fields: ["name", "qweb_template", "type"],
        domain: function(self) {
            var domain = [];
            var type = [];
            if (self.config.custom_ticket) {
                type.push("ticket");
            }
            if (self.config.custom_xml_receipt) {
                type.push("receipt");
            }

            domain.push(["type", "in", type]);
            return domain;
        },
        condition: function(self) {
            return self.config.custom_ticket || self.config.custom_xml_receipt;
        },
        loaded: function(self, templates) {
            self.custom_receipt_templates = templates;
        },
    });

    models.load_fields("product.product", ["second_product_name"]);
    models.load_fields("res.company", ["street", "city"]);

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        // Changes the current table.
        set_table: function(table) {
            var old_table = this.table;
            if (table && !this.order_to_transfer_to_different_table) {
                this.table = table;
                var orders = this.get_order_list();
                if (!orders.length) {
                    // Set opening datetime for table
                    table.open_time = this.get_current_datetime();
                }
            }
            this.table = old_table;
            _super_posmodel.set_table.apply(this, arguments);
        },
        get_current_datetime: function() {
            var d = new Date();

            var date = d.getDate();
            // January is 0
            var month = d.getMonth() + 1;
            var year = d.getFullYear();

            if (date < 10) {
                date = "0" + date;
            }

            if (month < 10) {
                month = "0" + month;
            }

            var hours = String(d.getHours());
            if (hours.length < 2) {
                hours = "0" + hours;
            }

            var minutes = String(d.getMinutes());
            if (minutes.length < 2) {
                minutes = "0" + minutes;
            }
            return {date: year + "." + month + "." + date, time: hours + ":" + minutes};
        },
    });

    models.Order = models.Order.extend({
        custom_qweb_render: function(template, options) {
            var template_name = $(template).attr("t-name");
            Qweb.templates[template_name] = template;
            return Qweb._render(template_name, options);
        },
        get_receipt_template_by_id: function(id, type) {
            return _.find(this.pos.custom_receipt_templates, function(receipt) {
                return receipt.id === id && receipt.type === type;
            });
        },
        get_last_orderline_user_name: function() {
            var lastorderline = this.get_last_orderline();
            var name = this.pos.get_cashier().name;
            if (
                lastorderline &&
                lastorderline.ms_info &&
                lastorderline.ms_info.created
            ) {
                name = lastorderline.ms_info.created.user.name;
            }
            return name;
        },
        get_receipt_type: function(type) {
            return this.receipt_type || _t("Receipt");
        },
        set_receipt_type: function(type) {
            this.receipt_type = type;
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        // Used to create a json of the ticket, to be sent to the printer
        export_for_printing: function() {
            var res = _super_orderline.export_for_printing.apply(this, arguments);
            res.second_product_name = this.get_product().second_product_name;
            return res;
        },
    });

    return models;
});
