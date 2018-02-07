# -*- coding: utf-8 -*-

from odoo.tests.common import TransactionCase
import time


class TestReward(TransactionCase):
    """Tests for attendance date ranges validity"""

    def setUp(self):
        super(TestReward, self).setUp()
        self.attendance = self.env['res.partner.attendance']
        self.pos_config = self.env['pos.config']
        self.res_partner = self.env['res.partner']
        self.test_partner = self.res_partner.search([('name', '=', 'David Simpson')])
        self.reward_model = self.env['pos.credit.update.reward']
        self.reward_type_model = self.env['pos.credit.update.reward.type']
        self.user = self.env.user
        self.debt_account = self.env['account.account']
        self.journal = self.env['account.journal']

    def test_reward(self):
        self.debt_account = self.debt_account.create({
            'name': 'Debt',
            'code': 'XTST',
            'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
            'company_id': self.user.company_id.id,
            'note': 'code "TST" is used for tests',
            })
        self.journal = self.pos_config.create_journal({
            'sequence_name': 'Test Credit Journal',
            'prefix': 'TST ',
            'user': self.user,
            'noupdate': True,
            'journal_name': 'Test Credit Journal',
            'code': 'TSTR',
            'type': 'cash',
            'debt': True,
            'journal_user': True,
            'debt_account': self.debt_account,
            'credits_via_discount': False,
            'category_ids': False,
            'write_statement': True,
            'debt_dummy_product_id': False,
            'debt_limit': 0,
            'pos_cash_out': True,
            })
        self.reward_type = self.reward_type_model.create({
            'name': 'test_reward',
            'journal_id': self.journal.id,
            'amount': 100,
        })
        self.test_attend = self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 9:00'),
            'check_out': time.strftime('%Y-%m-10 10:00'),
        })
        self.pcu_reward = self.reward_model.create({
            'partner_id': self.test_partner.id,
            'update_type': 'balance_update',
            'reward_type_id': self.reward_type.id,
        })
        self.pcu_reward._onchange_partner()
        self.pcu_reward.switch_to_confirm()
        # check that partners balance was properly updated
        self.assertEqual(self.test_partner.credit_balance, self.pcu_reward.balance)
        # sure that attendance was set correctly
        self.assertEqual(self.pcu_reward.attendance_ids.id, self.test_attend.id)
        # check journal update correctness
        self.assertEqual(self.test_partner.compute_debts_by_journals(self.test_partner.id)[self.journal.id]['balance'],
                         self.reward_type.amount)
