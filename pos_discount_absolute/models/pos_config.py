# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class PosConfig(models.Model):
    _name = 'pos.config'

    discount_abs_value = fields.Float(string='Discount value', default=0, help='The default discount value')
    discount_abs = fields.Boolean(string='Use absolute discount type', default=False, help='Discount type')
