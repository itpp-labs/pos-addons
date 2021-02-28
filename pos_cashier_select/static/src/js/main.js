/*  Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
    Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73/>
    Copyright 2020 Almas Giniatullin <https://it-projects.info/team/almas50>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_choosing_cashier", function (require) {
    "use strict";
    /* global Sha1*/
    const Registries = require("point_of_sale.Registries");
    const {useBarcodeReader} = require("point_of_sale.custom_hooks");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const useSelectEmployee = require("pos_cashier.useSelectEmployee");

    const PosProductScreen = (_ProductScreen) =>
        class extends _ProductScreen {
            constructor() {
                super(...arguments);
                const {selectEmployee, askPin} = useSelectEmployee();
                this.selectEmployee = selectEmployee;
                this.askPin = askPin;
                useBarcodeReader({
                    cashier: this._barcodeCashierAction,
                });
            }

            async _onClickPay() {
                const list = this.env.pos.employees.map((employee) => {
                    return {
                        id: employee.id,
                        item: employee,
                        label: employee.name,
                        isSelected: false,
                    };
                });

                const employee = await this.selectEmployee(list);
                if (employee) {
                    this.env.pos.set_cashier(employee);
                    this.showScreen("PaymentScreen");
                }
            }

            _barcodeCashierAction(code) {
                // eslint-disable-next-line
                let theEmployee;
                for (const employee of this.env.pos.employees) {
                    if (employee.barcode === Sha1.hash(code.code)) {
                        theEmployee = employee;
                        break;
                    }
                }

                if (!theEmployee) return;
                this.env.pos.set_cashier(theEmployee);
                this.trigger("close-popup");
                this.showScreen("PaymentScreen");
            }
        };

    Registries.Component.extend(ProductScreen, PosProductScreen);

    return ProductScreen;
});
