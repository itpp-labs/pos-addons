odoo.define("pos_debt_notebook.CreditNote", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class CreditNote extends PosComponent {
        get client() {
            const client = this.props.client || this.env.pos.get_client();

            if (this.props.journalId) {
                if (client && client.debts && client.debts[this.props.journalId]) {
                    return {
                        debt: client.debts[this.props.journalId].balance,
                    };
                }
                return null;
            }

            return client;
        }
    }

    CreditNote.template = "CreditNote";

    Registries.Component.add(CreditNote);

    return CreditNote;
});
