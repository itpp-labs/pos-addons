# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/kolushovalexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests import HttpCase, tagged


@tagged("at_install", "post_install")
class TestUi(HttpCase):
    def test_pos_keyboard(self):

        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_keyboard_tour', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_keyboard_tour.ready",
            login="admin",
        )
