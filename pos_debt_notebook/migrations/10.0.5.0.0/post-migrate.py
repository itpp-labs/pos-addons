# -*- coding: utf-8 -*-

# ====================================================================================================================
#                                      are needed to be migrated
# ====================================================================================================================

#                                      old database models:

# class ResPartner(models.Model):
#     _inherit = 'res.partner'                                                          -
#
#     debt_limit = fields.Float(                                             deleted field

# class AccountJournal(models.Model):
#     _inherit = 'account.journal                                                       -
#
# class Product(models.Model):
#     _inherit = 'product.template'                                                     -
#
#     credit_product = fields.Boolean(                            from boolean to many2one
#
# class PosCreditUpdate(models.Model):
#     _name = 'pos.credit.update'                                                       -


# =====================================================================================================================
# =====================================================================================================================
#                                           new database models:

# class ResPartner(models.Model):
#     _inherit = 'res.partner'
#     report_pos_debt_ids = fields.One2many('pos.credit.update', 'partner_id' new field
#
# class AccountJournal(models.Model):
#     _inherit = 'account.journal'
#
#     pos_cash_out = fields.Boolean(                                         new fields
#     category_ids = fields.Many2many('pos.category'
#     debt_limit = fields.Float(
#     credits_via_discount = fields.Boolean(
#     credits_autopay = fields.Boolean
#
# class Product(models.Model):
#     _inherit = 'product.template'
#
#     credit_product = fields.Many2one('account.journal'               from boolean to many2one
#
# class PosCreditUpdate(models.Model):
#     _name = 'pos.credit.update'
#     _inherit = ['mail.thread']
#
#     journal_id = fields.Many2one('account.journal'                          new field

from odoo import fields
from odoo import api, SUPERUSER_ID


def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})
    # env holds all currently loaded models

    debt_journals = env['account.journal'].search([('debt', '=', True)])

    # a try to save data from ['product.template'].credit_product
    if len(debt_journals) == 1:
        # if there was only one debt journal, all debt products may be correlated with it
        cr.execute('SELECT id, credit_product FROM product.template')
        for record_id, old_value in cr.fetchall():
            if old_value:
                new_value = (0, 0, debt_journals)
                cr.execute('UPDATE product.template SET credit_product = new_value')

    # for journal in debt_journals:
    #     journal.debt_limit = env['pos.config.settings'].debt_limit

    # env['pos.config.settings'].debt_limit is unused in new version. It was a default debt value for new partners

    # necessary to understand and separate whole debt into journal.debts
    # because it might be several debt journals with shared debt


