from odoo import models, fields


class RestaurantPrinter(models.Model):
    _inherit = 'restaurant.printer'

    product_ids = fields.Many2many('product.template', column1='printers_id',
                                   column2='product_id', string='Printed Products')


class ProductProduct(models.Model):
    _inherit = 'product.template'

    printers_ids = fields.Many2many('restaurant.printer', column1='product_id',
                                    column2='printers_id', string='Printers')
