import odoo.tests


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_longpolling_pos(self):
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('longpoll_connection_tour')",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.longpoll_connection_tour.ready",
            login="admin",
        )
