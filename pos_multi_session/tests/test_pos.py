# -*- coding: utf-8 -*-

import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_open_pos(self):
        self.phantom_js("/web?debug=assets#", "odoo.__DEBUG__.services['web_tour.tour'].run('open_pos_tour')",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.open_pos_tour.ready",
                        login="admin")
