# -*- coding: utf-8 -*-

import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_open_pos(self):
        self.phantom_js("/web?debug=assets#", "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_multi_session')",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_multi_session.ready",
                        login="admin")
