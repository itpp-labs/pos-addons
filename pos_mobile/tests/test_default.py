# -*- coding: utf-8 -*-
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        # see more https://odoo-development.readthedocs.io/en/latest/dev/tests/js.html#phantom-js-python-tests
        cr = self.registry.cursor()
        assert cr == self.registry.test_cr
        env = Environment(cr, self.uid, {})

        # get exist pos_config
        main_pos_config = env.ref('point_of_sale.pos_config_main')
        # create new session and open it
        main_pos_config.open_session_cb()

        self.phantom_js("/pos/web?m=1",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('pos_mobile_tour')",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_mobile_tour.ready",
                        login="admin",
                        timeout=240)

        for order in env['pos.order'].search([]):
            self.assertEqual(order.state, 'paid', "Validated order has payment of " + str(order.amount_paid) + " and total of " + str(order.amount_total))
