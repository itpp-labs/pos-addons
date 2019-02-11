# Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields


class Partner(models.Model):
    _inherit = 'res.partner'

    has_must_have_product = fields.Boolean('Has Must-have Product')
