# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_journal_pin(self):
        self.phantom_js(
            '/web',
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_journal_pin_tour')",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_journal_pin_tour.ready",
            login="admin",
            timeout=100,
        )
