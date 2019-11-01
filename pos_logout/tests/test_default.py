# Copyright 2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Kildebekov Anvar <https://it-projects.info/team/kildebekov>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        env = self.env

        # From https://github.com/odoo/odoo/blob/48dafd5b2011cee966920f664a904de2e2715ae8/addons/point_of_sale/tests/test_frontend.py#L306-L310
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.

        env['res.users'].create({
            'name': "test",
            'login': "test",
            'password': "test",
            'pos_security_pin': "0000",
        })
        env['ir.module.module'].search([('name', '=', 'pos_logout')], limit=1).state = 'installed'

        self.phantom_js(
            '/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_logout_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_logout_tour.ready",

            login="admin",
            timeout=240,
        )
