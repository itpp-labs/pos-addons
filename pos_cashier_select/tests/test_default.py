# Copyright 2021 Ivan Yelizariev <https://twitter.com/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>3>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
from odoo.tests import HttpCase, tagged


@tagged("-at_install", "post_install")
class TestUi(HttpCase):
    def test_01_pos_is_loaded(self):
        env = self.env
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env["ir.module.module"].search(
            [("name", "=", "pos_cashier_select")], limit=1
        ).state = "installed"

        self.browser_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_cashier_select_tour')",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_cashier_select_tour.ready",
            login="admin",
            timeout=240,
        )
