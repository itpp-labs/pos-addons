# -*- coding: utf-8 -*-
from openerp import models, fields, api, SUPERUSER_ID
from openerp.osv import osv
from openerp.osv import fields as old_fields
import openerp.addons.decimal_precision as dp
from openerp.tools.translate import _
from openerp.exceptions import UserError


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


class PosSession(osv.osv):
    _inherit = 'pos.session'

    def create(self, cr, uid, values, context=None):
        context = dict(context or {})
        config_id = values.get('config_id', False) or context.get('default_config_id', False)
        if not config_id:
            raise UserError(_("You should assign a Point of Sale to your session."))

        jobj = self.pool.get('pos.config')
        pos_config = jobj.browse(cr, uid, config_id, context=context)
        has_journals = pos_config.journal_ids

        res = super(PosSession, self).create(cr, uid, values)

        if not has_journals:
            debt_journal = self.pool['account.journal'].search(cr, SUPERUSER_ID, [
                ('code', '=', 'TDEBT'), ('company_id', '=', pos_config.company_id.id)])
            if debt_journal:
                debt_journal = debt_journal[0]
                debt_journal_obj = self.pool['account.journal'].browse(cr, uid, debt_journal)
                debt_journal_obj.write({'journal_user': True})
                pos_config.write({
                    'journal_ids': [(4, debt_journal)],
                    'debt_dummy_product_id': self.pool('ir.model.data').get_object_reference(cr, SUPERUSER_ID, 'pos_debt_notebook', 'product_pay_debt')[1],
                })

        return res
