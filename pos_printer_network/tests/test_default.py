# -*- coding: utf-8 -*-
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        env = Environment(self.registry.test_cr, self.uid, {})

        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env['ir.module.module'].search([('name', '=', 'pos_printer_network')], limit=1).state = 'installed'
        self.registry.cursor().release()
        self.phantom_js(
            '/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_printer_network_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_printer_network_tour.ready",

            login="admin",
            timeout=240,
        )
