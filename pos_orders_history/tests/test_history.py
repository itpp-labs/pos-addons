# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo.tests import tagged, HttpCase


@tagged('at_install', 'post_install')
class TestUi(HttpCase):

    def test_01_check_history(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env['ir.module.module'].search([('name', '=', 'pos_orders_history')], limit=1).state = 'installed'

        self.phantom_js(
            '/web',
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_orders_history_tour', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_orders_history_tour.ready",
            login="admin",
            timeout=240,
        )
