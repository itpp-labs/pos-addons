/*  Copyright 2020 Almas Giniatullin <https://it-projects.info/team/almas50>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_cashier.useSelectEmployee", function (require) {
    "use strict";
    /* global Sha1*/

    const {Component} = owl;

    function useSelectEmployee() {
        const current = Component.current;

        async function askPin(employee) {
            const {confirmed, payload: inputPin} = await this.showPopup("NumberPopup", {
                isPassword: true,
                title: this.env._t("Password ?"),
                startingValue: null,
            });

            if (!confirmed) return false;

            if (employee.pin === Sha1.hash(inputPin)) {
                return employee;
            }
            await this.showPopup("ErrorPopup", {
                title: this.env._t("Incorrect Password"),
            });
            return false;
        }

        async function selectEmployee(selectionList) {
            const {confirmed, payload: employee} = await this.showPopup(
                "SelectionPopup",
                {
                    title: this.env._t("Change Cashier"),
                    list: selectionList,
                }
            );

            if (!confirmed) return false;

            if (!employee.pin || this.env.pos.get_cashier() === employee) {
                return employee;
            }

            return await askPin.call(current, employee);
        }
        return {
            askPin: askPin.bind(current),
            selectEmployee: selectEmployee.bind(current),
        };
    }

    return useSelectEmployee;
});
