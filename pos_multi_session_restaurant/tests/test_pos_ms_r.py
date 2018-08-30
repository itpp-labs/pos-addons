# Copyright 2017 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_pos_ms_r(self):
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js("/web", "odoo.__DEBUG__.services['web_tour.tour'].run('open_pos_ms_r_tour', 1000)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.open_pos_ms_r_tour.ready",
                        login="admin")
