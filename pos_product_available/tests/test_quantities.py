# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests.common import HttpCase, tagged


@tagged("at_install", "post_install")
class TestUi(HttpCase):
    def test_pos_product_available(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env["ir.module.module"].search(
            [("name", "=", "pos_product_available")], limit=1
        ).state = "installed"

        product = env["product.product"].search(
            [("name", "=", "Office Chair Black")], limit=1
        )
        product.product_tmpl_id.write({"type": "product"})

        # updating product qty
        new_quantity = 3
        location = env["stock.location"].create({"name": "test_location"})
        picking_type = env["stock.picking.type"].create(
            {
                "name": "test_type",
                "code": "outgoing",
                "default_location_src_id": location.id,
                "sequence_code": "ttt",
                "warehouse_id": False,
            }
        )
        env["pos.config"].search([]).write({"picking_type_id": picking_type.id})
        env["stock.quant"].create(
            {
                "product_id": product.id,
                "location_id": location.id,
                "quantity": new_quantity,
            }
        )

        # without a delay there might be problems caused by a not yet loaded button's action
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_product_available', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_product_available.ready",
            login="admin",
            timeout=500,
        )
