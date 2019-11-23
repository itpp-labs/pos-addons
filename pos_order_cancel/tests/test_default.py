# -*- coding: utf-8 -*-
# Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017 gaelTorrecillas <https://github.com/gaelTorrecillas>
# Copyright 2017 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(False)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        cr = self.registry.cursor()
        env = Environment(cr, self.uid, {})
        env['ir.module.module'].search([('name', '=', 'pos_order_cancel')], limit=1).state = 'installed'
        cr.release()

        self.phantom_js(
            '/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_order_cancel_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_order_cancel_tour.ready",

            login="admin",
            timeout=240,
        )
