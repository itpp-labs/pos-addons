# -*- coding: utf-8 -*-
# Copyright 2019 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_pos_print_check(self):

        env = self.env
        env["ir.module.module"].search(
            [("name", "=", "pos_order_print_check")], limit=1
        ).state = "installed"

        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_order_print_check_tour')",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_order_print_check_tour.ready",
            login="admin",
            timeout=1000,
        )
