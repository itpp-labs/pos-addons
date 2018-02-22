# -*- coding: utf-8 -*-

import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestKiosk(odoo.tests.HttpCase):

    def test_kiosk(self):
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('test_kiosk_tour', 500)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.test_kiosk_tour.ready",
                        login="admin")
