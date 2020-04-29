# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests import HttpCase, tagged


@tagged("at_install", "post_install")
class TestUi(HttpCase):
    def test_01_pos_is_loaded(self):
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_pin_tour')",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_pin_tour.ready",
            login="admin",
            timeout=240,
        )
