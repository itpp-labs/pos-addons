# -*- coding: utf-8 -*-
from odoo import fields, models


class RestaurantPrinter(models.Model):
    _inherit = 'restaurant.printer'
    printer_method_name = fields.Selection([('default', 'Way 1'), ('separate_receipt', 'Way 2')], 'Print Method', default='default', help="Way 1: Print entire order on one receipt (default odoo method). \n\n Way 2: Print each order line on separate receipts")
