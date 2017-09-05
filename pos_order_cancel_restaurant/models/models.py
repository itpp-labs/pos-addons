# -*- coding: utf-8 -*-
from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    kitchen_canceled_only = fields.Boolean(string="Ask reason for kitchen order only",
                                           dafeult=False, help="Ask cancelation \ refund reason for printed at kitchen (i.e. cooked) orders only")


class PosOrderLineCanceled(models.Model):
    _inherit = "pos.order.line.canceled"

    was_printed = fields.Boolean("Product is Printed", default=False, readonly=True)
