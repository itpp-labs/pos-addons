# Copyright 2019 Vildan Safin <https://www.it-projects.info/team/Enigma228322>
# License MIT (https://opensource.org/licenses/MIT).


import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_qty_changing(self):
        product = self.env["product.product"].search([("name", "=", "Computer Case")])
        lot_product = self.env["product.product"].search(
            [("name", "=", "Little server")]
        )
        lot_qty = 5
        lot_product.write(
            {"is_lot": True, "lot_product_id": product.id, "lot_qty": lot_qty}
        )

        current_product_qty = product.qty_available
        current_product_virtual_qty = product.virtual_available
        # Splitting box of products
        lot_product.button_split_lot()
        self.assertTrue(
            product.qty_available - lot_qty == current_product_qty
            and product.virtual_available - lot_qty == current_product_virtual_qty
        )
