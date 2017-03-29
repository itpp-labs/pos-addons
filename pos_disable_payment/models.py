# -*- coding: utf-8 -*-
from openerp import fields
from openerp import models


class PosConfig(models.Model):
    _inherit = 'res.users'

    allow_payments = fields.Boolean('Allow payments', default=True)
    allow_delete_order = fields.Boolean('Allow remove non-empty order', default=True)
    allow_discount = fields.Boolean('Allow discount', default=True)
    allow_edit_price = fields.Boolean('Allow edit price', default=True)
    allow_decrease_amount = fields.Boolean('Allow decrease order line', default=True)
    allow_delete_order_line = fields.Boolean('Allow remove order line', default=True)
    allow_create_order_line = fields.Boolean('Allow create order line', default=True)
