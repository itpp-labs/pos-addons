# -*- coding: utf-8 -*-
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        # see more https://odoo-development.readthedocs.io/en/latest/dev/tests/js.html#phantom-js-python-tests
        env = Environment(self.registry.test_cr, self.uid, {})
        product = env.ref('point_of_sale.boni_orange')
        product.write({
            'pos_category_ids': [(4, category.id) for category in env['pos.category'].search([])]
        })
        # get exist pos_config
        main_pos_config = env.ref('point_of_sale.pos_config_main')
        # create new session and open it
        main_pos_config.open_session_cb()
        self.phantom_js(
            '/pos/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_category_multi_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_category_multi_tour.ready",

            login="admin",
            timeout=240,
        )
