# -*- coding: utf-8 -*-
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_open_pos(self):
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_multi_session', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_multi_session.ready",
            login="admin",
            timeout=80,
        )
