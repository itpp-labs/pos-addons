odoo.define("pos_fiscal_current", function(require) {
    "use strict";
    var screens = require("point_of_sale.screens");

    screens.OrderWidget.include({
        update_summary: function() {
            this._super();
            var order = this.pos.get_order();
            if (typeof order.fiscal_position !== "undefined") {
                if (this.el.querySelector(".summary .total .fiscal .value") !== null) {
                    this.el.querySelector(
                        ".summary .total .fiscal .value"
                    ).textContent = order.fiscal_position.name;
                }
            }
        },
    });
});
