# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

import odoo.tests
from odoo import _, tools


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_pos_product_available(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env["ir.module.module"].search(
            [("name", "=", "pos_product_available")], limit=1
        ).state = "installed"

        product = env["product.product"].search([("name", "=", "LED Lamp")], limit=1)
        product.product_tmpl_id.write({"type": "product"})

        # updating product qty
        new_quantity = 3
        company_user = self.env.user.company_id
        location = (
            self.env["stock.warehouse"]
            .search([("company_id", "=", company_user.id)], limit=1)
            .lot_stock_id
        )
        th_qty = product.qty_available
        inventory = self.env["stock.inventory"].create(
            {
                "name": _("INV: %s") % tools.ustr(product.display_name),
                "filter": "product",
                "product_id": product.id,
                "location_id": location.id,
                "line_ids": [
                    (
                        0,
                        0,
                        {
                            "product_qty": new_quantity,
                            "location_id": location.id,
                            "product_id": product.id,
                            "product_uom_id": product.uom_id.id,
                            "theoretical_qty": th_qty,
                        },
                    )
                ],
            }
        )
        inventory.action_validate()

        # without a delay there might be problems caused by a not yet loaded button's action
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_product_available', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_product_available.ready",
            login="admin",
            timeout=200,
        )
