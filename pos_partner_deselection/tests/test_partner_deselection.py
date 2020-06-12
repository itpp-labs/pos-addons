# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_01_partner_deselection(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env

        env["ir.module.module"].search(
            [("name", "=", "pos_partner_deselection")], limit=1
        ).state = "installed"

        env["pos.config"].search([]).write({"customer_deselection_interval": 1})

        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_partner_deselection_tour'), 500",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_partner_deselection_tour.ready",
            login="admin",
            timeout=100,
        )
