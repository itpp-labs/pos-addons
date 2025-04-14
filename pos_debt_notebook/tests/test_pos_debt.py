# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests import HttpCase, tagged


@tagged("-at_install", "post_install")
class TestUi(HttpCase):
    def test_pos_debt(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env["ir.module.module"].search(
            [("name", "=", "pos_debt_notebook")], limit=1
        ).state = "installed"

        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.start_tour(
            "/web",
            "tour_pos_debt_notebook",
            500,
            login="admin",
            timeout=1000,
        )
