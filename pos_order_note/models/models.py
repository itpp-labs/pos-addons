from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = "product.template"
    pos_notes = fields.Text("Auto-applied Note for Kitchen", translate=True)


class PosProductNotes(models.Model):
    _name = "pos.product_notes"
    _description = "POS Product Notes"

    sequence = fields.Integer(string="Sequence")
    name = fields.Char(string="Note")
    pos_category_ids = fields.Many2many('pos.category', string='Point of Sale Categories',
                                        help='The note will be available for this group of POS categories. '
                                             'Leave the field empty so that the note is available for all POS categories.')
