# Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73/>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests
from odoo.api import Environment


@odoo.tests.tagged('post_install', '-at_install')
class TestUi(odoo.tests.HttpCase):
    def test_pos_scan_ref(self):
        # cr = self.registry.cursor()
        # env = Environment(cr, self.uid, {})
        # self.env["ir.module.module"].search(
        #     [("name", "=", "pos_scan_ref")], limit=1
        # ).state = "installed"
        # self.env["product.template"].search([("name", "=", "Boni Oranges")], limit=1).write(
        #     {"default_code": "1234567890333"}
        # )
        # cr.release()
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        # self.start_tour(
        #     "/web",
        #     "tour_pos_scan_ref",
        #     # "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_scan_ref', 1000)",
        #     # "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_scan_ref.ready",
        #     login="admin",
        #     # timeout=140,
        # )

        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_scan_ref')",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_scan_ref.ready",
                        login="admin")
