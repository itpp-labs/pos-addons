import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def test_pos_debt(self):
        env = Environment(self.registry.test_cr, self.uid, {})
        view_partner_form_debt = env.ref('pos_debt_notebook.view_partner_form_debt')
        view_partner_form_debt.write({
            'debt_limit': 50,
        })
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_debt_notebook', 1000)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_debt_notebook.ready",
                        login="admin", timeout=140)
