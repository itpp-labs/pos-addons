import odoo.tests


@odoo.tests.tagged('post_install', 'at_install')
class TestUi(odoo.tests.HttpCase):

    def test_01_pos_is_loaded(self):

        # see more https://odoo-development.readthedocs.io/en/latest/dev/tests/js.html#phantom-js-python-tests
        env = self.env(user=self.env.ref('base.user_admin'))

        # get exist pos_config
        bar_pos_config = env.ref('pos_restaurant.pos_config_restaurant')
        # create new session and open it
        bar_pos_config.open_session_cb()

        env['ir.module.module'].search([('name', '=', 'pos_mobile_restaurant')], limit=1).state = 'installed'

        self.phantom_js(
            '/pos/web?m=1',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_mobile_tour')",

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_mobile_tour.ready",

            login="admin",
            timeout=1000,
        )
