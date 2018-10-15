# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Artem Losev
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import models, fields, api

CHANNEL = "pos_orders_history_receipt"


class PosConfig(models.Model):
    _inherit = 'pos.config'

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


class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.multi
    def action_pos_session_close(self):
        orders = self.env['pos.order'].search([('state', '=', 'paid')])
        res = super(PosSession, self).action_pos_session_close()
        references = [order.pos_reference for order in orders]
        receipts = self.env['pos.xml_receipt'].search([('pos_reference', 'in', references), ('status', '=', True)])
        receipts.write({
            'status': False
        })
        return res


class PosConfig(models.Model):
    _inherit = 'pos.config'

    reprint_orders = fields.Boolean("Reprint Orders", help="Reprint paid POS Orders with POS interface", default=True)
