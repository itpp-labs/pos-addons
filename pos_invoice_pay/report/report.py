# Copyright 2018 Artyom Losev
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import api, models


class ReportSaleDetails(models.AbstractModel):

    _inherit = "report.point_of_sale.report_saledetails"

    @api.model
    def get_sale_details(
        self, date_start=False, date_stop=False, config_ids=False, session_ids=False
    ):
        res = super(ReportSaleDetails, self).get_sale_details(
            date_start, date_stop, config_ids, session_ids
        )

        # note on porting to 13.0
        # for some reason we don't use session_ids

        if not config_ids:
            configs = self.env["pos.config"].search([])
        else:
            configs = self.env["pos.config"].search([("id", "in", config_ids)])

        payments = self.env["account.payment"].search(
            [
                ("datetime", ">=", date_start),
                ("datetime", "<=", date_stop),
                ("pos_session_id", "in", configs.mapped("session_ids").ids),
            ]
        )

        res["invoices"] = []
        unique = []
        res["total_invoices"] = res["total_invoices_cash"] = 0.0
        for p in payments:
            if p.move_id.id not in unique:
                invoice = p.move_id
                cashier = p.cashier
                for pay in invoice.line_ids.mapped("payment_id"):
                    data = {
                        "invoice_no": invoice.name,
                        "so_origin": invoice.invoice_origin,
                        "customer": invoice.partner_id.name,
                        "payment_method": pay.journal_id.name,
                        "cashier": cashier.name or cashier.partner_id.name,
                        "amount_total": invoice.amount_total,
                        "amount": pay.amount,
                    }
                    res["invoices"].append(data)
                    res["total_invoices"] += pay.amount
                    if pay.journal_id.type == "cash":
                        res["total_invoices_cash"] += pay.amount
                unique.append(p.move_id.id)

        return res
