# -*- coding: utf-8 -*-

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    iface_order_merge = fields.Boolean(string="Order Merge", help="Enables Order Merging in the Point of Sale", default=True)
