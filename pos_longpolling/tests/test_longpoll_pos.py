from odoo.tests import tagged, HttpCase


@tagged('at_install', 'post_install')
class TestUi(HttpCase):

    def test_longpolling_pos(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env['ir.module.module'].search([('name', '=', 'pos_longpolling')], limit=1).state = 'installed'

        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('longpoll_connection_tour')",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.longpoll_connection_tour.ready",
                        login="admin")
