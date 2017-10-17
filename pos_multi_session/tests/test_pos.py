# -*- coding: utf-8 -*-

import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_pos(self):
        self.phantom_js("/pos/web", "odoo.__DEBUG__.services['web_tour.tour'].run('pos_tour')",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_tour.ready",
                        login="admin")
