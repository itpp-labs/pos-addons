# Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Artem Losev
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models, api


CHANNEL = "pos_orders_history"


class PosConfig(models.Model):
    _inherit = 'pos.config'

    orders_history = fields.Boolean("Orders History", help="Show all orders list in POS", default=True)
    current_day_orders_only = fields.Boolean("Current Day Orders Only", help="Show current day orders only", default=True)
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

    pos_name = fields.Char(related="config_id.name")
