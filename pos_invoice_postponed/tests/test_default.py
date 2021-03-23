# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_01_pos_postponed_invoice(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        self.env["ir.module.module"].search(
            [("name", "=", "point_of_sale")], limit=1
        ).state = "installed"

        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_invoice_postponed_tour', 1000)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_invoice_postponed_tour.ready",
            login="admin",
            timeout=240,
        )

        order = self.env["pos.order"].search([], order="id desc", limit=1)

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
