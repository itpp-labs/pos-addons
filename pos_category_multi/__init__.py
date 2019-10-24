# Copyright 2019 Anvar kildebekov <https://it-projects.info/team/fedoranvar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from . import models

from odoo import SUPERUSER_ID
from odoo import api

def copy_categories(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    for product in list(env["product.template"].search([])):
        if product.pos_categ_id:
            product.write({
                'pos_category_ids': [(4, product.pos_categ_id.id)]
                })
