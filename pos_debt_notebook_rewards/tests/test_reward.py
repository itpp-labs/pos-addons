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
        self.pcu_reward_model = self.env['pos.credit.update.rewards']
        self.p_debt_reward = self.env['pos.debt.reward']
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
            'code': 'TSTJ',
            'type': 'cash',
            'debt': True,
            'journal_user': True,
            'debt_account': self.debt_account,
            'credits_via_discount': False,
            'category_ids': False,
            'write_statement': True,
            'debt_dummy_product_id': False,
            })
        self.p_debt_reward = self.p_debt_reward.create({
            'name': 'test_reward',
            'journal_id': self.journal.id,
            'amount': 100,
        })
        self.test_attend = self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 9:00'),
            'check_out': time.strftime('%Y-%m-10 10:00'),
        })
        self.pcu_reward = self.pcu_reward_model.create({
            'partner_id': self.test_partner.id,
            'update_type': 'balance_update',
            'reward_type': self.p_debt_reward.id
        })
        self.pcu_reward.switch_to_confirm()
        self.assertEqual(self.test_partner.credit_balance, self.pcu_reward.balance)

        # Sure that next reward will be for the unpaid attendance, not for the both

        self.test_attend_1 = self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 10:00'),
            'check_out': time.strftime('%Y-%m-10 11:-00'),
        })
        self.pcu_reward = self.pcu_reward_model.create({
            'partner_id': self.test_partner.id,
            'update_type': 'balance_update',
            'reward_type': self.p_debt_reward.id
        })
        self.pcu_reward.switch_to_confirm()
        self.assertEqual(self.test_partner.credit_balance, 2*self.p_debt_reward.amount)
