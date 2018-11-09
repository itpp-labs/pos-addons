# -*- coding: utf-8 -*-
import odoo.tests
from odoo.api import Environment


# tests is not work when pos_category_multi and pos_order_cancel_restaurant was installed,
# pos_category_multi replaces the pos_categ_id field to pos_category_ids
# to use at_install

@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        # see more https://odoo-development.readthedocs.io/en/latest/dev/tests/js.html#phantom-js-python-tests
        env = Environment(self.registry.test_cr, self.uid, {})

        main_pos_config = env.ref('point_of_sale.pos_config_main')

        main_pos_config.write({
            'save_canceled_kitchen_orders_only': True,
        })

        self.phantom_js(
            '/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_order_cancel_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_order_cancel_tour.ready",

            login="admin",
            timeout=240,
        )
