import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):
        env = self.env
        main_pos_config = env.ref('point_of_sale.pos_config_main')
        product = env.ref('point_of_sale.product_product_consumable')
        main_pos_config.write({
            'module_pos_discount': True,
            'discount_product_id': product.id,
            'discount_pc': 10.0
        })
        env['ir.module.module'].search([('name', '=', 'pos_product_category_discount')], limit=1).state = 'installed'

        self.phantom_js(
            '/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_product_category_discount_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_product_category_discount_tour.ready",

            login="admin",
            timeout=1000,
        )
