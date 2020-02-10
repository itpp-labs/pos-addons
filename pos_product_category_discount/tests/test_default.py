# -*- coding: utf-8 -*-
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_01_pos_is_loaded(self):
        # see more https://odoo-development.readthedocs.io/en/latest/dev/tests/js.html#phantom-js-python-tests
        env = Environment(self.registry.test_cr, self.uid, {})

        main_pos_config = env.ref("point_of_sale.pos_config_main")

        main_pos_config.write({"iface_discount": True})
        main_pos_config.discount_product_id = env.ref("point_of_sale.boni_orange")

        main_pos_config.open_session_cb()

        env["ir.module.module"].search(
            [("name", "=", "pos_product_category_discount")], limit=1
        ).state = "installed"

        self.phantom_js(
            "/pos/web",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_product_category_discount_tour')",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_product_category_discount_tour.ready",
            login="admin",
            timeout=240,
        )
