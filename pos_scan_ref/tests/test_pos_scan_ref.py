# Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73/>
# Copyright 2020 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests


@odoo.tests.tagged("post_install", "-at_install")
class TestUi(odoo.tests.HttpCase):
    def test_pos_scan_ref(self):
        self.env["product.template"].search(
            [("name", "=", "Cabinet with Doors")], limit=1
        ).write({"default_code": "1234567890333"})
        self.browser_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_scan_ref')",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_scan_ref.ready",
            login="admin",
            timeout=140,
        )
