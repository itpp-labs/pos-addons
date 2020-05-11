# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def common_test(self, test_login):

        env = self.env
        #  For QWeb loading
        env["ir.module.module"].search(
            [("name", "=", "pos_mail")], limit=1
        ).state = "installed"
        #  Step 1
        #  define demo-template variable
        env["pos.config"].search([]).write({"send_receipt_by_mail": True})
        tmplt = env.ref("pos_mail.pos_mail_body_template")
        wrong_text = "<script><p></p></script>" "<p></p>" '<img src="link" href="">'
        correct_text = "<p></p>" "<p></p>" '<img src="link">'
        tmplt.body_html = wrong_text
        #  Step 2
        #  tour: 'send receipt via mail'
        self.browser_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_mail_tour', 1000)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_mail_tour.ready",
            login=test_login,
        )
        #  Step 3
        #  Check correctness of sended email
        check_text = env["mail.mail"].search([], limit=1).body
        self.assertEqual(check_text, correct_text)

    def test_01_pos_mail(self):
        self.common_test("admin")
