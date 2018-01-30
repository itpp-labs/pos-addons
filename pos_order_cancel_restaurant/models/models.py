# -*- coding: utf-8 -*-
from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    kitchen_canceled_only = fields.Boolean(string="Ask reason for kitchen orders only",
                                           dafault=False, help="Ask cancelation / refund reason for printed at kitchen (i.e. cooked) orders only")
    auto_send_to_kitchen = fields.Boolean(string="Automatically Sent to the Kitchen",
                                          help="Automatically Sent to the Kitchen after cancelation / refund of the orderline (if the line was sent earlier)",
                                          dafault=False)

class PosOrderLineCanceled(models.Model):
    _inherit = "pos.order.line.canceled"

    was_printed = fields.Boolean("Printed", default=False, readonly=True, help="Product was printed at kitchen printer. Usually it means, that product was canceled after being cooked.")
