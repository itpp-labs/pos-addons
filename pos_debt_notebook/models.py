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
        debt_account = self.env.ref('pos_debt_notebook.debt_account')
        debt_journal = self.env['account.journal'].search([
            ('company_id', '=', self.env.user.company_id.id),
            ('debt', '=', True)
        ])
        print 'debt_j', debt_journal

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
        digits=dp.get_precision('Account'))


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

    def init_debt_journal(self, cr, uid, ids, context=None):
        company_ids = self.pool['res.company'].search(cr, uid, [])
        for company in self.pool['res.company'].browse(cr, uid, company_ids):
            if len(self.pool['account.account'].search(cr, uid, [('company_id', '=', company.id)])) <= 1:
                raise osv.except_osv(_('Error!'), _('You have to configure chart of account for company: "%s"'
                                                    % company.name))

            debt_journal_active = self.pool['account.journal'].search(cr, uid, [
                ('company_id', '=', company.id), ('debt', '=', True)])
            if debt_journal_active:
                break
            else:
                debt_account = self.pool['account.account'].search(cr, uid, [
                    ('name', '=', 'Debt'), ('code', '=', 'XDEBT'), ('company_id', '=', company.id)])
                if debt_account:
                    debt_account = debt_account[0]
                else:
                    debt_account = self.pool['account.account'].create(cr, uid, {
                        'name': 'Debt',
                        'code': 'XDEBT',
                        'type': 'liquidity',
                        'user_type': self.pool.get('ir.model.data').get_object_reference(cr, uid, 'account', 'data_account_type_asset')[1],
                        'company_id': company.id
                    })
                    self.pool['ir.model.data'].create(cr, uid, {
                        'name': 'debt_account',
                        'model': 'account.account',
                        'module': 'pos_debt_notebook',
                        'res_id': debt_account,
                        'noupdate': True,
                    })

                debt_journal_inactive = self.pool['account.journal'].search(cr, uid, [
                    ('company_id', '=', company.id), ('debt', '=', False), ('code', '=', 'TDEBT')])
                if debt_journal_inactive:
                    new_journal = self.pool['account.journal'].browse(cr, uid, debt_journal_inactive[0])
                    new_journal.write({
                        'debt': True,
                        'sequence_id': self.pool.get('ir.model.data').get_object_reference(cr, uid, 'pos_debt_notebook', 'sequence_debt_journal')[1],
                        'default_debit_account_id': debt_account,
                        'default_credit_account_id': debt_account,
                    })
                    new_journal = new_journal.id
                else:
                    new_journal = self.pool['account.journal'].create(cr, uid, {
                        'name': 'Debt Journal',
                        'code': 'TDEBT',
                        'type': 'cash',
                        'debt': True,
                        'journal_user': True,
                        'sequence_id': self.pool.get('ir.model.data').get_object_reference(cr, uid, 'pos_debt_notebook', 'sequence_debt_journal')[1],
                        'company_id': company.id,
                        'default_debit_account_id': debt_account,
                        'default_credit_account_id': debt_account,
                    })
                    self.pool['ir.model.data'].create(cr, uid, {
                        'name': 'debt_journal_' + str(new_journal),
                        'model': 'account.journal',
                        'module': 'pos_debt_notebook',
                        'res_id': int(new_journal),
                        'noupdate': True,
                    })

                config_ids = self.search(cr, uid, [('company_id', '=', company.id)])
                for config in self.browse(cr, uid, config_ids):
                    config.write({
                        'journal_ids': [(4, new_journal)],
                        'debt_dummy_product_id': self.pool.get('ir.model.data').get_object_reference(cr, uid, 'pos_debt_notebook', 'product_pay_debt')[1],
                    })
