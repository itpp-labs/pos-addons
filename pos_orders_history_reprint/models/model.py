# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Artem Losev
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import models, fields


class PosReceipt(models.Model):
    _name = 'pos.xml_receipt'

    receipt = fields.Char()
    pos_reference = fields.Char()

    def save_xml_receipt(self, name, receipt):
        self.create({
            "pos_reference": name,
            "receipt": receipt,
        })


class PosOrder(models.Model):
    _inherit = "pos.order"

    def send_pos_ticket_reprint_data(self):
        paymentlines = []
        taxes = []

        for line in self.lines:
            for tax in line.tax_ids:
                taxes.append({
                    'id': tax.id,
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


class PosConfig(models.Model):
    _inherit = 'pos.config'

    reprint_orders = fields.Boolean("Reprint Orders", help="Reprint paid POS Orders with POS interface", default=True)
