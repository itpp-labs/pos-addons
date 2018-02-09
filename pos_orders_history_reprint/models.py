# -*- coding: utf-8 -*-
from odoo import models, api

class PosOrder(models.Model):
    _inherit = "pos.order"


    def send_pos_ticket_reprint_data(self):
        data = []
        paymentlines = []
        taxes = []

        for line in self.lines:
            for tax in line.tax_ids:
                taxes.append({
                    'name': tax.name,
                    'amount': (line.price_subtotal_incl - line.price_subtotal) / line.qty
                })

        for s in self.statement_ids:
            if s.amount > 0:
                paymentlines.append({
                    'name': '%s (%s) ' % (s.journal_id.name, s.journal_currency_id.name), 
                    'amount': s.amount,
                })

        return {
            'paymentlines': paymentlines,
            'taxes': taxes
        }
