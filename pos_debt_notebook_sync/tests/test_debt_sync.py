# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class TestUi(HttpCase):
    def test_pos_debt(self):
        # without a delay there might be problems caused by a not yet loaded button's action
        self.browser_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_debt_notebook_sync', 1000)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_debt_notebook_sync.ready",
            login="admin",
            timeout=1000,
        )
