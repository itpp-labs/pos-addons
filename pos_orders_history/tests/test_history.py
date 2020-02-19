# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

import logging

import odoo.tests

_logger = logging.getLogger(__name__)


class TestUi(odoo.tests.HttpCase):
    def main_test(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env["ir.module.module"].search(
            [("name", "=", "pos_orders_history")], limit=1
        ).state = "installed"

        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('pos_orders_history_tour', 500)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.pos_orders_history_tour.ready",
            login="admin",
            timeout=240,
        )


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(False)
class TestUiAtInstall(TestUi):
    def test_01_check_history(self):
        self.main_test()


@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestUiPostInstall(TestUi):
    def test_01_check_history(self):
        env = self.env
        dependent_module = env["ir.module.module"].search(
            [
                (
                    "name",
                    "in",
                    ["pos_orders_history_return", "pos_orders_history_reprint"],
                ),
                ("state", "=", "installed"),
            ],
            limit=1,
        )

        if not dependent_module:
            self.main_test()
            return

        _logger.info(
            "test_01_check_history post_install tour is skipped"
            " due to %s module is installed too" % dependent_module.name
        )
