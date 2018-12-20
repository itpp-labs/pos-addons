# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Artem Losev
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import models, fields, api

CHANNEL = "pos_orders_history_receipt"


class PosConfig(models.Model):
    _inherit = 'pos.config'

    reprint_orders = fields.Boolean("Reprint Orders", help="Reprint paid POS Orders with POS interface", default=True)

    # ir.actions.server methods:
    @api.model
    def notify_receipt_updates(self):
        ids = self.env.context['active_ids']
        if len(ids):
            message = {"updated_receipts": ids}
            self.search([])._send_to_channel(CHANNEL, message)


class PosReceipt(models.Model):
    _name = 'pos.xml_receipt'

    receipt = fields.Char("Receipt")
    pos_reference = fields.Char("Reference")
    receipt_type = fields.Selection([('xml', 'XML'), ('ticket', 'Ticket')], "Receipt Type")
    # active or not active receipt
    status = fields.Boolean('Status', default=True)

    def save_xml_receipt(self, name, receipt, receipt_type):
        self.create({
            "pos_reference": name,
            "receipt": receipt,
            "receipt_type": receipt_type,
        })


class PosOrder(models.Model):
    _inherit = "pos.order"
    order_receipt_id = fields.Many2one('pos.xml_receipt', 'Order Receipt')  # In fact is one2one

    def _create_account_move_line(self, session=None, move=None):
        orders = self.filtered(lambda o: not o.account_move or o.state == 'paid')
        res = super(PosOrder, self)._create_account_move_line(session, move)
        references = [order.pos_reference for order in orders]
        receipts = self.env['pos.xml_receipt'].search([('pos_reference', 'in', references), ('status', '=', True)])
        for r in receipts:
            r.write({
                'status': False
            })
        return res
