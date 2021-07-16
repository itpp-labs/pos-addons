odoo.define("pos_debt_notebook.ReceiptScreen", function (require) {
    "use strict";

    const ReceiptScreen = require("point_of_sale.ReceiptScreen");
    const Registries = require("point_of_sale.Registries");

    const MyReceiptScreen = (_ReceiptScreen) =>
        class extends _ReceiptScreen {
            orderDone() {
                super.orderDone();
                if (this.props.isAutopayValidated) {
                    this.showPopup("ThumbUpPopup", {});
                }
            }

            // TODO: copy from pos_debt_notebook v13's ReceitScreenWidget. Don't know, should it be moved
            //        render_change: function() {
            //            // Deduct the number of discount credits, because they were spent on discounts, but still presence like unspent
            //            var order = this.pos.get_order();
            //            this.$(".change-value").html(this.format_currency(order.get_change()));
            //        }
        };

    Registries.Component.extend(ReceiptScreen, MyReceiptScreen);
});
