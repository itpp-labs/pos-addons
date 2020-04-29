# Copyright 2017 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests import HttpCase, tagged


@tagged("at_install", "post_install")
class TestUi(HttpCase):
    def test_01_pos_is_loaded_and_added_note_to_order(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env(user=self.env.ref("base.user_admin"))
        env["ir.module.module"].search(
            [("name", "=", "pos_order_note")], limit=1
        ).state = "installed"
        env["pos.config"].search([]).write(
            {"module_pos_restaurant": True, "iface_orderline_notes": True}
        )

        self.browser_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_order_note_tour', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_order_note_tour.ready",
            login="admin",
            timeout=240,
        )
