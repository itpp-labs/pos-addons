# Copyright 2018 Artyom Losev
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import api, models


class ReportSaleDetails(models.AbstractModel):

    _inherit = "report.point_of_sale.report_saledetails"

    @api.model
    def get_sale_details(self, date_start=False, date_stop=False, configs=False):
        res = super(ReportSaleDetails, self).get_sale_details(
            date_start, date_stop, configs
        )

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
            if p.invoice_ids.id not in unique:
                invoice = p.invoice_ids
                cashier = p.cashier
                for pay in invoice.payment_ids:
                    data = {
                        "invoice_no": invoice.number,
                        "so_origin": invoice.origin,
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
                unique.append(p.invoice_ids.id)

        return res
