from odoo.tests import HttpCase, tagged


@tagged("-at_install", "post_install")
class TestUi(HttpCase):
    def test_01_pos_is_loaded(self):
        self.browser_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('pos_orderline_absolute_discount_tour')",
            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours.pos_orderline_absolute_discount_tour.ready",
            login="admin",
            timeout=240,
        )
