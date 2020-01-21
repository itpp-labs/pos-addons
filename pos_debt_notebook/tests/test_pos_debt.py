# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import odoo.tests
from odoo.api import Environment


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):

    def common_test(self, test_login):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        cr = self.registry.cursor()
        env = Environment(cr, self.uid, {})
        env['ir.module.module'].search([('name', '=', 'pos_debt_notebook')], limit=1).state = 'installed'
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        # Step 1: Init
        # import wdb;wdb.set_trace()
        test_partner = env['res.partner'].search([('name', '=', 'Agrolait')])
        test_journal = [
            env['account.journal'].search([('name', '=', 'Credits')]),
            env['account.journal'].search([('name', '=', 'Credits (Fruits & Vegetables only)')]),
            env['account.journal'].search([('name', '=', 'Credits (via discounts)')])
        ]
        self.env['product.template'].search([("name", "=", "Lemon")]).write({
            'list_price': 3.0,
            'lst_price': 3.0
            })
        self.env['product.template'].search([("name", "=", "Miscellaneous")]).write({
            'list_price': 1.0,
            'lst_price': 1.0
            })
        cr.release()
        # Step 2: Tour Test
        self.phantom_js("/web",
                        "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_debt_notebook', 500)",
                        "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_debt_notebook.ready",
                        login=test_login, timeout=200)
        # Step 3: Check debt-balance
        #  check for 'Credits' balance
        self.assertEqual(test_partner.debt_history()[test_partner.id]['debts'][test_journal[0].id]['balance'], 1.0)
        #  check for 'Credits (Fruits&Vegetables)' balance
        self.assertEqual(test_partner.debt_history()[test_partner.id]['debts'][test_journal[1].id]['balance'], 1.0)
        #  check for 'Credits (via discounts)' balance
        self.assertEqual(test_partner.debt_history()[test_partner.id]['debts'][test_journal[2].id]['balance'], -2.0)

    def test_01_pos_debt(self):
        self.common_test("admin")
