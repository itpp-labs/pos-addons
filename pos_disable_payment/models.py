# -*- coding: utf-8 -*-
from odoo import fields, models, api


class PosConfig(models.Model):
    _inherit = 'res.users'

    allow_payments = fields.Boolean('Allow payments', default=True)
    allow_delete_order = fields.Boolean('Allow remove non-empty order', default=True)
    allow_discount = fields.Boolean('Allow discount', default=True)
    allow_edit_price = fields.Boolean('Allow edit price', default=True)
    allow_decrease_amount = fields.Boolean('Allow decrease order line', default=True)
    allow_decrease_kitchen_only = fields.Boolean('Allow change Qty for kitchen orders', default=False)
    allow_delete_order_line = fields.Boolean('Allow remove order line', default=True)
    allow_create_order_line = fields.Boolean('Allow create order line', default=True)
    allow_refund = fields.Boolean('Allow refunds', default=True)
    is_restaurant_installed = fields.Boolean(compute='_compute_state')

    def _compute_state(self):
        for r in self:
            r.is_restaurant_installed = r.is_module_installed('pos_restaurant')

    @api.model
    def is_module_installed(self, module_name=None):
        return module_name in self.env['ir.module.module']._installed()
