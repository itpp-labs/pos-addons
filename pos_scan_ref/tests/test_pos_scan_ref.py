import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_pos_scan_ref(self):
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_scan_ref', 1000)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_scan_ref.ready",
                        login="admin", timeout=140)
