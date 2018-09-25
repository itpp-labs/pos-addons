import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class WebSuite(odoo.tests.HttpCase):

    def test_01_js(self):
        # webclient desktop test suite
        self.phantom_js('/web/tests?mod=web&failfast', "", "", login='admin', timeout=1800)

    def test_02_js(self):
        # webclient mobile test suite
        self.phantom_js('/web/tests/mobile?mod=web&failfast', "", "", login='admin', timeout=1800)
