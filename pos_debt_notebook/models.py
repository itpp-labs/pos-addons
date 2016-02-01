# -*- coding: utf-8 -*-
from openerp import models, fields, api
from openerp.osv import osv
from openerp.osv import fields as old_fields
import openerp.addons.decimal_precision as dp
from openerp.tools.translate import _


class ResPartner(models.Model):
    _inherit = 'res.partner'

    @api.multi
    def _get_debt(self):
        debt_account = self.env['account.account'].search([
            ('company_id', '=', self.env.user.company_id.id), ('code', '=', 'XDEBT')])
        debt_journal = self.env['account.journal'].search([
            ('company_id', '=', self.env.user.company_id.id), ('debt', '=', True)])

        self._cr.execute(
            """SELECT l.partner_id, SUM(l.debit - l.credit)
            FROM account_move_line l
            WHERE l.account_id = %s AND l.partner_id IN %s
            GROUP BY l.partner_id
            """,
            (debt_account.id, tuple(self.ids)))

        res = {}
        for partner in self:
            res[partner.id] = 0
        for partner_id, val in self._cr.fetchall():
            res[partner_id] += val

        statements = self.env['account.bank.statement'].search(
            [('journal_id', '=', debt_journal.id), ('state', '=', 'open')])
        if statements:

            self._cr.execute(
                """SELECT l.partner_id, SUM(l.amount)
                FROM account_bank_statement_line l
                WHERE l.statement_id IN %s AND l.partner_id IN %s
                GROUP BY l.partner_id
                """,
                (tuple(statements.ids), tuple(self.ids)))
            for partner_id, val in self._cr.fetchall():
                res[partner_id] += val
        for partner in self:
            partner.debt = res[partner.id]

    debt = fields.Float(
        compute='_get_debt', string='Debt', readonly=True,
        digits=dp.get_precision('Account'), help='This debt value for only current company')


class AccountJournal(models.Model):
    _inherit = 'account.journal'

    debt = fields.Boolean(string='Debt Payment Method')


class PosConfig(osv.osv):
    _inherit = 'pos.config'

    _columns = {
        'debt_dummy_product_id': old_fields.many2one(
            'product.product',
            string='Dummy Product for Debt',
            domain=[('available_in_pos', '=', True)],
            help="Dummy product used when a customer pays his debt "
                 "without ordering new products. This is a workaround to the fact "
                 "that Odoo needs to have at least one product on the order to "
                 "validate the transaction.")
    }
