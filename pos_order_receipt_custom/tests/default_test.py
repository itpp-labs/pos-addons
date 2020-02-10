# -*- coding: utf-8 -*-
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_01_pos_is_loaded_and_print_order_to_kitchen(self):
        # see more https://odoo-development.readthedocs.io/en/latest/dev/tests/js.html#phantom-js-python-tests
        env = Environment(self.registry.test_cr, self.uid, {})

        kitchen_printer = env.ref("pos_restaurant.kitchen_printer")
        receipt_template = env.ref("pos_order_receipt_custom.simple_kitchen_receipt")

        kitchen_printer.write(
            {
                "custom_order_receipt": True,
                "custom_order_receipt_id": [(6, 0, [receipt_template.id])],
            }
        )

        main_pos_config = env.ref("point_of_sale.pos_config_main")
        main_pos_config.open_session_cb()

        self.phantom_js(
            "/pos/web",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_order_receipt_custom_tour')",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_order_receipt_custom_tour.ready",
            login="admin",
            timeout=240,
        )
