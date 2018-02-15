# -*- coding: utf-8 -*-

# ===================================================================================================================
#                                                 old database models:

# class ResPartner(models.Model):
#     _inherit = 'res.partner'
#
#     debt = fields.Float(
#     credit_balance = fields.Float(
#     debt_company = fields.Float(
#     credit_balance_company = fields.Float(
#     debt_type = fields.Selection(
#     debt_limit = fields.Float(
#
# class PosConfig(models.Model):
#     _inherit = 'pos.config'
#
#     debt_dummy_product_id = fields.Many2one('product.product'
#
# class AccountJournal(models.Model):
#     _inherit = 'account.journal'
#
#     debt = fields.Boolean(
#
# class PosConfiguration(models.TransientModel):
#     _inherit = 'pos.config.settings'
#
#     debt_type = fields.Selection(
#     debt_limit = fields.Float(
#
# class Product(models.Model):
#
#     _inherit = 'product.template'
#
#     credit_product = fields.Boolean(
#
# class PosOrder(models.Model):
#     _inherit = "pos.order"
#
#     product_list = fields.Text(
#
# class PosCreditUpdate(models.Model):
#     _name = 'pos.credit.update'
#
#     partner_id = fields.Many2one('res.partner'
#     user_id = fields.Many2one('res.users',
#     company_id = fields.Many2one('res.company',
#     currency_id = fields.Many2one('res.currency',
#     balance = fields.Monetary(
#     new_balance = fields.Monetary(
#     note = fields.Text(
#     date = fields.Datetime(
#     state = fields.Selection(
#     update_type = fields.Selection(

# =====================================================================================================================
#                                           new database models:
#
# class ResPartner(models.Model):
#     _inherit = 'res.partner'
#
#     debt = fields.Float(
#     credit_balance = fields.Float(
#     debt_company = fields.Float(
#     credit_balance_company = fields.Float(
#     debt_type = fields.Selection(
#     report_pos_debt_ids = fields.One2many('pos.credit.update', 'partner_id'
#
# class PosConfig(models.Model):
#     _inherit = 'pos.config'
#
#     debt_dummy_product_id = fields.Many2one('product.product'
#
# class AccountJournal(models.Model):
#     _inherit = 'account.journal'
#
#     debt = fields.Boolean(
#     pos_cash_out = fields.Boolean(
#     category_ids = fields.Many2many('pos.category'
#     debt_limit = fields.Float(
#     credits_via_discount = fields.Boolean(
#     credits_autopay = fields.Boolean
#
# class PosConfiguration(models.TransientModel):
#     _inherit = 'pos.config.settings'
#
#     debt_type = fields.Selection
#     debt_limit = fields.Float(
#
# class Product(models.Model):
#
#     _inherit = 'product.template'
#
#     credit_product = fields.Many2one('account.journal'
#
# class PosOrder(models.Model):
#     _inherit = "pos.order"
#
#     product_list = fields.Text(
#
# class PosCreditUpdate(models.Model):
#     _name = 'pos.credit.update'
#     _description = "Manual Credit Updates"
#     _inherit = ['mail.thread']
#
#     partner_id = fields.Many2one('res.partner'
#     user_id = fields.Many2one('res.users'
#     company_id = fields.Many2one('res.company',
#     currency_id = fields.Many2one('res.currency',
#     balance = fields.Monetary(
#     new_balance = fields.Monetary(
#     note = fields.Text(
#     date = fields.Datetime(
#     state = fields.Selection(
#     update_type = fields.Selection(
#     journal_id = fields.Many2one('account.journal'

# ====================================================================================================================
#                                      are needed to be migrated
# ====================================================================================================================

#                                      old database models:

# class ResPartner(models.Model):
#     _inherit = 'res.partner'                                                          -

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
#     report_pos_debt_ids = fields.One2many('pos.credit.update', 'partner_id'    new field
#
# class AccountJournal(models.Model):
#     _inherit = 'account.journal'
#
#     pos_cash_out = fields.Boolean(                                            new fields
#     category_ids = fields.Many2many('pos.category'
#     debt_limit = fields.Float(
#     credits_via_discount = fields.Boolean(
#     credits_autopay = fields.Boolean
#
# class Product(models.Model):
#     _inherit = 'product.template'
#
#     credit_product = fields.Many2one('account.journal'           from boolean to many2one
#
# class PosCreditUpdate(models.Model):
#     _name = 'pos.credit.update'
#     _inherit = ['mail.thread']
#
#     journal_id = fields.Many2one('account.journal'                              new field


def migrate(cr, version):                        # WHICH VERSION SHOULD BE PASTED HERE? PREVIOUS OR PRESENT
    cr.execute('ALTER TABLE product.template '
               'ALTER COLUMN credit_product Many2one')



