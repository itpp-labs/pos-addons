# Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Artem Losev
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models, api
import re


CHANNEL = "pos_orders_history"


class PosConfig(models.Model):
    _inherit = 'pos.config'

    orders_history = fields.Boolean("Orders History", help="Show all orders list in POS", default=True)
    load_barcode_order_only = fields.Boolean("Load Specific Orders only",
                                             help="Load an order after scan the barcode only rather than all existing orders", default=False)

    load_orders_of_last_n_days = fields.Boolean("Orders of last 'n' days", default=False)
    number_of_days = fields.Integer("Number of days", default=0, help='0 - load orders of current day')

    show_cancelled_orders = fields.Boolean("Show Cancelled Orders", default=True)
    show_posted_orders = fields.Boolean("Show Posted Orders", default=False)
    show_barcode_in_receipt = fields.Boolean("Show Barcode in Receipt", default=True)

    # ir.actions.server methods:
    @api.model
    def notify_orders_updates(self):
        ids = self.env.context['active_ids']
        if len(ids):
            message = {"updated_orders": ids}
            self.search([])._send_to_channel(CHANNEL, message)


class PosOrder(models.Model):
    _inherit = 'pos.order'

    pos_name = fields.Char(related="config_id.name", string='Point of Sale Name')
    pos_history_reference_uid = fields.Char(compute='_compute_pos_history_reference_uid', readonly=True, store=True)

    @api.depends('pos_reference')
    def _compute_pos_history_reference_uid(self):
        for r in self:
            reference = r.pos_reference and re.search(r'\d{1,}-\d{1,}-\d{1,}', r.pos_reference)
            r.pos_history_reference_uid = reference and reference.group(0) or ''
