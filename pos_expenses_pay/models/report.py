# Copyright 2018 Artyom Losev
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
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

        expenses = self.env["hr.expense.sheet"].search(
            [
                ("payment_datetime", ">=", date_start),
                ("payment_datetime", "<=", date_stop),
                ("state", "=", "done"),
                ("pos_session_id", "in", configs.mapped("session_ids").ids),
            ]
        )
        res["expenses_total"] = 0
        res["expenses"] = []
        for e in expenses:
            for line in e.expense_line_ids:
                data = {
                    "date": line.date,
                    "name": line.name,
                    "partner": line.employee_id.name,
                    "cashier": e.cashier,
                    "amount": line.total_amount * -1,
                }
                res["expenses"].append(data)
                res["expenses_total"] = res["expenses_total"] + data["amount"]
        return res
