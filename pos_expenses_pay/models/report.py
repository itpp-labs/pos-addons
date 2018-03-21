# -*- coding: utf-8 -*-
import datetime
from odoo import api, fields, models


class ReportSaleDetails(models.AbstractModel):

    _inherit = 'report.point_of_sale.report_saledetails'

    @api.model
    def get_sale_details(self, date_start=False, date_stop=False, configs=False):
        res = super(ReportSaleDetails, self).get_sale_details(date_start=False, date_stop=False, configs=False)

        if date_start:
            date_start = fields.Datetime.from_string(date_start)
        else:
            date_start = datetime.date.today()
        if date_stop:
            date_stop = fields.Datetime.from_string(date_stop)
        else:
            date_stop = datetime.date.today() + datetime.timedelta(days=1, seconds=-1)

        date_stop = max(date_stop, date_start)

        date_start = fields.Datetime.to_string(date_start)
        date_stop = fields.Datetime.to_string(date_stop)

        expenses = self.env['hr.expense.sheet'].search([
            ('accounting_date', '>=', date_start),
            ('accounting_date', '<=', date_stop),
            ('state', '=', 'done')
        ])
        res['expenses'] = []
        for e in expenses:
            for line in e.expense_line_ids:
                data = {
                    'date': line.date,
                    'name': line.name,
                    'partner': line.employee_id.name,
                    'cashier': e.cashier,
                    'amount': line.total_amount*-1
                }
                res['expenses'].append(data)

        return res
    