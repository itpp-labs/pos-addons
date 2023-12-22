odoo.define("pos_debt_notebook.DebtHistoryLine", function (require) {


    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class DebtHistoryLine extends PosComponent {}

    DebtHistoryLine.template = "DebtHistoryLine";

    Registries.Component.add(DebtHistoryLine);

    return DebtHistoryLine;
});
