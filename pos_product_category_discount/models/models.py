from odoo import fields, models


class PosCategoryDiscount(models.Model):
    _name = "pos.category_discount"
    _description = "Category Discount"
    category_discount_pc = fields.Float(string="Discount Percentage", default=10, help="The default discount percentage")
    discount_category_id = fields.Many2one("pos.category", string="Product Category", help="The category used to model the discount")
    discount_program_id = fields.Many2one("pos.discount_program", string="Discount Program")


class PosDiscountProgram(models.Model):
    _name = "pos.discount_program"
    _description = "Discount Program"
    _rec_name = "discount_program_name"
    discount_program_name = fields.Char(string="Name", required=True)
    discount_program_number = fields.Integer(string="Sequence")
    discount_program_active = fields.Boolean(string="Active", default=True, help="Activate or deactivate the discount program in POS")
    discount_category_ids = fields.One2many("pos.category_discount", "discount_program_id", string='Discount Category')


class ProductTemplate(models.Model):
    _inherit = "product.template"
    discount_allowed = fields.Boolean(string="Discount allowed", help="Check if you want this product discount allowed in the Point of Sale", default=True)


class ResPartner(models.Model):
    _inherit = "res.partner"

    discount_program_id = fields.Many2one("pos.discount_program", string="Discount Program", help="That programm will be applied when customer is selected")
