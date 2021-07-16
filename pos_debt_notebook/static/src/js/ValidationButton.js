odoo.define("pos_debt_notebook.ValidationButton", function (require) {
    "use strict";

    const {useRef} = owl.hooks;
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class ValidationButton extends PosComponent {
        constructor() {
            super(...arguments);
            this.title = useRef("title");
            this.autopay = useRef("autopay");
        }
    }

    ValidationButton.template = "ValidationButton";

    Registries.Component.add(ValidationButton);

    return ValidationButton;
});
