# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def main(self, login):
        self.phantom_js(
            "/pos/web?m=1",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_invoice_postponed_tour', 1000)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_invoice_postponed_tour.ready",
            login=login,
            timeout=240,
        )

        cr = self.registry.cursor()
        cr.execute('select "id" from "pos_order" order by "id" desc limit 1')
        res = cr.fetchall()
        env = Environment(cr, self.uid, {})
        order = env["pos.order"].browse(res[0])

        self.assertEqual(
            len(order.statement_ids),
            0,
            "Number of statements are {} expected {}".format(
                len(order.statement_ids), 0
            ),
        )
        self.assertEqual(
            order.amount_paid,
            0,
            "Amount paid is {} expected {}".format(order.amount_paid, 0),
        )
        cr.release()

    def test_01_pos_postponed_invoice(self):
        self.main("admin")

    def test_02_pos_postponed_invoice(self):
        self.main("demo")
