# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_pos_debt(self):
        # without a delay there might be problems caused by a not yet loaded button's action
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_debt_notebook', 1000)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_debt_notebook.ready",
                        login="admin", timeout=1000)
