# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUI(odoo.tests.HttpCase):

    def test_pos_product_available_negative(self):

        env = Environment(self.registry.test_cr, self.uid, {})
        env['product.template'].search([('name', '=', 'Yellow Pepper')]).write({
            'type': 'product',
        })
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_product_available_negative', 1000)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_product_available_negative.ready",
                        login="admin", timeout=150)
