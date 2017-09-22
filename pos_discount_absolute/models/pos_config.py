# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    discount_abs_value = fields.Float(string='Discount value', default=0, help='The default discount value')
    discount_abs_on = fields.Boolean(string='Use absolute discount type', default=False, help='Discount type')
    discount_abs_type = fields.Boolean(default=True)
