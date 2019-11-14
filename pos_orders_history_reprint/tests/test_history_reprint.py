# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env['ir.module.module'].search([('name', '=', 'pos_orders_history_reprint')], limit=1).state = 'installed'

        self.phantom_js(
            '/web',
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_orders_history_reprint_tour', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_orders_history_reprint_tour.ready",
            login="admin",
            timeout=240,
        )
