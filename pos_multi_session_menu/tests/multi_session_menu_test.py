# -*- coding: utf-8 -*-
import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def multi_session_menu_test(self):
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_multi_session_menu_tour')",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_multi_session_menu_tour.ready",
            login="admin",
            timeout=240,
        )
