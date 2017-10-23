# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase


class TestPosCreditUpdate(TransactionCase):
    def get_credit_balance(self_, balance, new_balance):
        return -balance + new_balance

    def test_newbalance(self):
        partner_id = 8
        posCreditUpdate = self.env['pos.credit.update']
        for i, new_balance in enumerate([0, 20, -20, 15, 10]):
            posCreditUpdate.create({
                'id': i,
                'partner_id': partner_id,
                'new_balance': new_balance,
                'state': 'draft',
                'update_type': 'new_balance'
            })
        entries = posCreditUpdate.search([('partner_id', '=', partner_id), ('state', '=', 'cancel'), ('update_type', '=', 'new_balance')])
        credit_balance = posCreditUpdate.partner_id.browse(partner_id).credit_balance
        for e in entries:
            self.assertEqual(credit_balance, self.get_credit_balance(e.balance, e.new_balance))

        for i, new_balance in enumerate([40, 20, -40, 35, -5]):
            posCreditUpdate.write({
                'id': i,
                'partner_id': partner_id,
                'new_balance': new_balance,
                'state': 'draft',
                'update_type': 'new_balance'
            })
        entries = posCreditUpdate.search([('partner_id', '=', partner_id), ('state', '=', 'cancel'), ('update_type', '=', 'new_balance')])
        credit_balance = posCreditUpdate.partner_id.browse(partner_id).credit_balance
        for e in entries:
            self.assertEqual(credit_balance, self.get_credit_balance(e.balance, e.new_balance))
