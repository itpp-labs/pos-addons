# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo.tests import tagged, HttpCase


@tagged('at_install', 'post_install')
class TestUi(HttpCase):

    def test_01_pos_is_loaded(self):
        self.phantom_js(
            '/web',
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_pin_tour')",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_pin_tour.ready",
            login="admin",
            timeout=240,
        )
