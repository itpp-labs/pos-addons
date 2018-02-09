# -*- coding: utf-8 -*-
from odoo import fields, models, api
import json


CHANNEL = "pos_orders_history"


class PosConfig(models.Model):
    _inherit = 'pos.config'

    orders_history = fields.Boolean("Orders History", help="Show all orders list in POS", default=True)
    current_day_orders_only = fields.Boolean("Current Day Orders Only", help="Show current day orders only", default=True)
    show_cancelled_orders = fields.Boolean("Show Cancelled Orders", default=True)
    details_button = fields.Boolean("Details Button", help="Check the box for available the Details Button"
                                                           " in Orders History screen", default=True)

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

    def edit_pos_order_from_ui(self, data):
        data = json.loads(data)
        new_partner_id = data.get('partner_id', False)
        if new_partner_id:
            self.partner_id = new_partner_id
        return self.id
