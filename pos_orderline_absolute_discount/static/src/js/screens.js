odoo.define("pos_absolute_discount.screens", function (require) {
    "use strict";
    const NumpadWidget = require("point_of_sale.NumpadWidget");
    const Registries = require("point_of_sale.Registries");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const OrderReceipt = require("point_of_sale.OrderReceipt");

    const PosOrderReceipt = (_OrderReceipt) =>
        class extends _OrderReceipt {
            isSimple(line) {
                return (
                    line.discount === 0 &&
                    line.unit_name === "Units" &&
                    line.absolute_discount === 0 &&
                    line.quantity === 1 &&
                    !(
                        line.display_discount_policy === "without_discount" &&
                        line.price !== line.price_lst
                    )
                );
            }
        };

    const PosProductScreen = (_ProductScreen) =>
        class extends _ProductScreen {
            constructor() {
                super(...arguments);
                this.absolute_discount_active = true;
            }

            _setValue(val) {
                if (
                    this.currentOrder.get_selected_orderline() &&
                    this.state.numpadMode === "discount"
                ) {
                    if (this.absolute_discount_active) {
                        this.currentOrder
                            .get_selected_orderline()
                            .set_absolute_discount(Number(val));
                    } else {
                        this.currentOrder.get_selected_orderline().set_discount(val);
                    }
                } else {
                    super._setValue(val);
                }
            }

            change_discount_type() {
                if (this.absolute_discount_active) {
                    this.absolute_discount_active = false;
                    $(".mode-button:eq(1)").removeClass(
                        "selected-absolute-discount-mode"
                    );
                } else {
                    this.absolute_discount_active = true;
                    $(".mode-button:eq(1)").addClass("selected-absolute-discount-mode");
                }
            }

            _setNumpadMode(event) {
                super._setNumpadMode(event);
                const {mode} = event.detail;
                if (mode === "discount") {
                    this.change_discount_type();
                }
            }
        };

    const PosNumpadWidget = (_NumpadWidget) =>
        class extends _NumpadWidget {
            changeMode(mode) {
                super.changeMode(mode);
                if (mode === "discount") {
                    $(".mode-button:eq(1)").addClass("selected-mode");
                } else {
                    $(".mode-button:eq(1)").removeClass(
                        "selected-absolute-discount-mode"
                    );
                    $(".mode-button:eq(1)").removeClass("selected-mode");
                }
            }
        };

    Registries.Component.extend(ProductScreen, PosProductScreen);
    Registries.Component.extend(NumpadWidget, PosNumpadWidget);
    Registries.Component.extend(OrderReceipt, PosOrderReceipt);
    return {ProductScreen, NumpadWidget, OrderReceipt};
});
