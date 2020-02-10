# -*- coding: utf-8 -*-
from odoo import fields, models


class RestaurantPrinter(models.Model):
    _inherit = "restaurant.printer"
    printer_method_name = fields.Selection(
        [("default", "Order"), ("separate_receipt", "Order Line")],
        "Print Method",
        default="default",
        help="Order: Print entire order on one receipt (default odoo method). \n\n Order Line: Print each order line on separate receipts",
        required=True,
    )
