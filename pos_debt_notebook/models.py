# -*- coding: utf-8 -*-
from openerp import models, fields, api, SUPERUSER_ID
from openerp.osv import osv
from openerp.osv import fields as old_fields
import openerp.addons.decimal_precision as dp


class ResPartner(models.Model):
    _inherit = 'res.partner'

    @api.multi
    def _get_debt(self):
        debt_journal = self.env['account.journal'].search([
            ('company_id', '=', self.env.user.company_id.id), ('debt', '=', True)])
        debt_account = []
        for journal in debt_journal:
            debt_account.append(journal.default_debit_account_id.id)

        res = {}
        for partner in self:
            res[partner.id] = 0
        if len(debt_account) > 0:
            self._cr.execute(
                """SELECT l.partner_id, SUM(l.debit - l.credit)
                FROM account_move_line l
                WHERE l.account_id IN %s AND l.partner_id IN %s
                GROUP BY l.partner_id
                """,
                (tuple(debt_account), tuple(self.ids)))

            for partner_id, val in self._cr.fetchall():
                res[partner_id] += val

        statements = self.env['account.bank.statement'].search(
            [('journal_id', 'in', [j.id for j in debt_journal]), ('state', '=', 'open')])

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
        journal_obj = self.pool['account.journal']
        user = self.pool['res.users'].browse(cr, uid, uid, context=context)
        debt_journal_active = journal_obj.search(cr, SUPERUSER_ID, [
            ('code', '=', 'TDEBT'),
            ('name', '=', 'Debt Journal'),
            ('company_id', '=', user.company_id.id),
            ('debt', '=', True),
        ])
        if debt_journal_active:
            #  Check if the debt journal is created already for the company.
            return

        account_obj = self.pool['account.account']
        mod_obj = self.pool['ir.model.data']
        debt_account_old_version = account_obj.search(cr, SUPERUSER_ID, [
            ('code', '=', 'XDEBT'), ('company_id', '=', user.company_id.id)])
        if debt_account_old_version:
            debt_account = debt_account_old_version[0]
        else:
            debt_account = account_obj.create(cr, uid, {
                'name': 'Debt',
                'code': 'XDEBT',
                'user_type_id': mod_obj.get_object_reference(cr, SUPERUSER_ID, 'account', 'data_account_type_current_assets')[1],
                'company_id': user.company_id.id,
                'note': 'code "XDEBT" should not be modified as it is used to compute debt',
            })
            mod_obj.create(cr, SUPERUSER_ID, {
                'name': 'debt_account_for_company' + str(user.company_id.id),
                'model': 'account.account',
                'module': 'pos_debt_notebook',
                'res_id': debt_account,
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })

        debt_journal_inactive_id = journal_obj.search(cr, SUPERUSER_ID, [
            ('code', '=', 'TDEBT'),
            ('name', '=', 'Debt Journal'),
            ('company_id', '=', user.company_id.id),
            ('debt', '=', False),
        ])
        if debt_journal_inactive_id:
            debt_journal_inactive = journal_obj.browse(cr, uid, debt_journal_inactive_id[0], context=context)
            debt_journal_inactive.write({
                'debt': True,
                'default_debit_account_id': debt_account,
                'default_credit_account_id': debt_account
            })
            debt_journal = debt_journal_inactive.id
        else:
            new_sequence = self.pool['ir.sequence'].create(cr, SUPERUSER_ID, {
                'name': 'Account Default Debt Journal ' + str(user.company_id.id),
                'padding': 3,
                'prefix': 'DEBT ' + str(user.company_id.id),
            })
            mod_obj.create(cr, SUPERUSER_ID, {
                'name': 'journal_sequence' + str(new_sequence),
                'model': 'ir.sequence',
                'module': 'pos_debt_notebook',
                'res_id': new_sequence,
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })
            debt_journal = journal_obj.create(cr, SUPERUSER_ID, {
                'name': 'Debt Journal',
                'code': 'TDEBT',
                'type': 'cash',
                'debt': True,
                'journal_user': True,
                'sequence_id': new_sequence,
                'company_id': user.company_id.id,
                'default_debit_account_id': debt_account,
                'default_credit_account_id': debt_account,
            })
            mod_obj.create(cr, SUPERUSER_ID, {
                'name': 'debt_journal_' + str(debt_journal),
                'model': 'account.journal',
                'module': 'pos_debt_notebook',
                'res_id': int(debt_journal),
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })

        config = self.browse(cr, uid, ids[0], context=context)
        config.write({
            'journal_ids': [(4, debt_journal)],
            'debt_dummy_product_id': mod_obj.get_object_reference(cr, SUPERUSER_ID, 'pos_debt_notebook', 'product_pay_debt')[1],
        })

        statement = [(0, 0, {
            'journal_id': debt_journal,
            'user_id': uid,
            'company_id': user.company_id.id
        })]
        current_session = config.current_session_id
        current_session.write({
            'statement_ids': statement,
        })
        return

    def open_session_cb(self, cr, uid, ids, context=None):
        res = super(PosConfig, self).open_session_cb(cr, uid, ids, context)
        self.init_debt_journal(cr, uid, ids, context)
        return res


class AccountJournal(models.Model):
    _inherit = 'account.journal'

    debt = fields.Boolean(string='Debt Payment Method')
