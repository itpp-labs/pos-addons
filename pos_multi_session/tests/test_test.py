# -*- coding: utf-8 -*-

import odoo
from odoo import fields
from odoo.tools import float_compare, mute_logger
from odoo.tests.common import TransactionCase
# from odoo.addons.point_of_sale.tests.common import TestPointOfSaleCommon

@odoo.tests.common.at_install(False)
@odoo.tests.common.post_install(True)
class TestPoSSessionState(TransactionCase):

    def test_current_session_state(self):

        self.pos_config = self.env.ref('point_of_sale.pos_config_main')

        # I click on create a new session button
        self.pos_config.open_session_cb()

        # Check that this session state is opened
        self.assertEqual(
            self.pos_config.current_session_state, 'opened')

        # _search_current_session_state function check
        poses_with_opened_sessions = self.env['pos.config'].search([('current_session_state', '=', 'opened')])
        poses_with_not_opened_sessions = self.env['pos.config'].search([('current_session_state', '!=', 'opened')])
        poses_with_opened_sessions = map(lambda x: x.id, poses_with_opened_sessions)
        poses_with_not_opened_sessions = map(lambda x: x.id, poses_with_not_opened_sessions)
        third_case = map(lambda x: x.id,  self.env['pos.config'].search([('current_session_state', '>', 'opened')]))
        # Checking two cases: operator = '=' and operator = '!='
        self.assertEqual(
            poses_with_opened_sessions[0], 1)
        self.assertNotIn(
            1, poses_with_not_opened_sessions)
        self.assertEqual(
            len(third_case), 0)
