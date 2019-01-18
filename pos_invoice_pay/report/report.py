# -*- coding: utf-8 -*-
# Copyright 2018 Artyom Losev
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import datetime
from openerp.addons.point_of_sale.report.pos_details import pos_details
from openerp.osv import osv
from openerp import fields


class ReportSaleDetails(pos_details):

    def get_invoices_details(self, form):
        res = {}
        date_start, date_stop = self._get_utc_time_range(form)
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

        payments_obj = self.pool.get('account.payment')
        cr, uid, context = self.cr, self.uid, self.localcontext
        payments_ids = payments_obj.search(cr, uid, [
            ('payment_date', '>=', date_start),
            ('payment_date', '<=', date_stop),
            ('paid_by_pos', '=', True)
        ])
        payments = payments_obj.browse(cr, uid, payments_ids, context)

        res['invoices'] = []
        unique = []
        res['total_invoices'] = res['total_invoices_cash'] = 0.0
        for p in payments:
            if p.invoice_ids.id not in unique:
                invoice = p.invoice_ids
                cashier = p.cashier
                for pay in invoice.payment_ids:
                    data = {
                        'invoice_no': invoice.number,
                        'so_origin': invoice.origin,
                        'customer': invoice.partner_id.name,
                        'payment_method': pay.journal_id.name,
                        'cashier': cashier.name or cashier.partner_id.name,
                        'amount_total': invoice.amount_total,
                        'amount': pay.amount
                    }
                    res['invoices'].append(data)
                    res['total_invoices'] += pay.amount
                    if pay.journal_id.type == 'cash':
                        res['total_invoices_cash'] += pay.amount
                unique.append(p.invoice_ids.id)
        return res

    def __init__(self, cr, uid, name, context):
        super(ReportSaleDetails, self).__init__(cr, uid, name, context)
        self.localcontext.update({
            'get_invoices_details': self.get_invoices_details,
        })


class report_pos_details(osv.AbstractModel):
    _name = 'report.point_of_sale.report_detailsofsales'
    _inherit = 'report.point_of_sale.report_detailsofsales'
    _template = 'point_of_sale.report_detailsofsales'
    _wrapped_report_class = ReportSaleDetails
