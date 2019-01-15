# Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017 Stanislav Krotov <https://it-projects.info/team/ufaks>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import models, tools, api, fields


class PosDebtReport(models.Model):

    _name = "report.pos.debt"
    _description = "POS Debt Statistics"
    _auto = False
    _order = 'date desc'

    order_id = fields.Many2one('pos.order', string='POS Order', readonly=True)
    invoice_id = fields.Many2one('account.invoice', string='Invoice', readonly=True)
    payment_id = fields.Many2one('account.payment', string='Payment', readonly=True)
    update_id = fields.Many2one('pos.credit.update', string='Manual Update', readonly=True)

    date = fields.Datetime(string='Date', readonly=True)
    partner_id = fields.Many2one('res.partner', string='Partner', readonly=True)
    user_id = fields.Many2one('res.users', string='Salesperson', readonly=True)
    session_id = fields.Many2one('pos.session', string='Session', readonly=True)
    config_id = fields.Many2one('pos.config', string='POS', readonly=True)
    company_id = fields.Many2one('res.company', string='Company', readonly=True)
    currency_id = fields.Many2one('res.currency', string='Currency', readonly=True)
    journal_id = fields.Many2one('account.journal', string='Journals', readonly=True)

    state = fields.Selection([('open', 'Open'), ('confirm', 'Validated')], readonly=True)
    credit_product = fields.Boolean(string='Journal Credit Product', help="Record is registered as Purchasing credit product", readonly=True)
    balance = fields.Monetary('Balance', help="Negative value for purchases without money (debt). Positive for credit payments (prepament or payments for debts).", readonly=True)
    product_list = fields.Text('Product List', readonly=True)

    @api.model_cr
    def init(self):
        tools.drop_view_if_exists(self._cr, 'report_pos_debt')
        self._cr.execute("""
            CREATE OR REPLACE VIEW report_pos_debt AS (
                (
                --
                -- Using Debt journal in POS
                --
                SELECT
                    st_line.id as id,
                    o.id as order_id,
                    NULL::integer as invoice_id,
                    NULL::integer as payment_id,
                    NULL::integer as update_id,
                    -st_line.amount as balance,
                    st.state as state,
                    false as credit_product,

                    o.date_order as date,
                    o.partner_id as partner_id,
                    o.user_id as user_id,
                    o.session_id as session_id,
                    session.config_id as config_id,
                    o.company_id as company_id,
                    pricelist.currency_id as currency_id,
                    o.product_list as product_list,

                    st.journal_id as journal_id

                FROM account_bank_statement_line as st_line
                    LEFT JOIN account_bank_statement st ON (st.id=st_line.statement_id)
                    LEFT JOIN account_journal journal ON (journal.id=st.journal_id)
                    LEFT JOIN pos_order o ON (o.id=st_line.pos_statement_id)

                    LEFT JOIN pos_session session ON (session.id=o.session_id)
                    LEFT JOIN product_pricelist pricelist ON (pricelist.id=o.pricelist_id)
                WHERE
                    journal.debt=true
                )
                UNION ALL
                (
                --
                -- Sales of credit products in POS
                --
                SELECT
                    -pos_line.id as id,
                    o.id as order_id,
                    NULL::integer as invoice_id,
                    NULL::integer as payment_id,
                    NULL::integer as update_id,
                    -- FIXME: price_subtotal cannot be used, because it's not stored field
                    pos_line.price_unit * qty as balance,
                    CASE o.state
                        WHEN 'done' THEN 'confirm'
                        WHEN 'paid' THEN 'open'
                        ELSE o.state
                    END as state,
                    true as credit_product,

                    o.date_order as date,
                    o.partner_id as partner_id,
                    o.user_id as user_id,
                    o.session_id as session_id,
                    session.config_id as config_id,
                    o.company_id as company_id,
                    pricelist.currency_id as currency_id,
                    o.product_list as product_list,

                    pt.credit_product as journal_id

                FROM pos_order_line as pos_line
                    LEFT JOIN product_product pp ON (pp.id=pos_line.product_id)
                    LEFT JOIN product_template pt ON (pt.id=pp.product_tmpl_id)

                    LEFT JOIN pos_order o ON (o.id=pos_line.order_id)

                    LEFT JOIN pos_session session ON (session.id=o.session_id)
                    LEFT JOIN product_pricelist pricelist ON (pricelist.id=o.pricelist_id)
                    LEFT JOIN account_journal journal ON (journal.id=pt.credit_product)
                WHERE
                    journal.debt=true
                    AND o.state IN ('paid','done')
                )
                UNION ALL
                (
                --
                -- Sales of credit products in via Invoices
                --
                SELECT
                    (2147483647 - inv_line.id) as id,
                    NULL::integer as order_id,
                    inv.id as invoice_id,
                    NULL::integer as payment_id,
                    NULL::integer as update_id,
                    inv_line.price_subtotal as balance,
                    'confirm' as state,
                    true as credit_product,

                    inv.date_invoice as date,
                    inv.partner_id as partner_id,
                    inv.user_id as user_id,
                    NULL::integer as session_id,
                    NULL::integer as config_id,
                    inv.company_id as company_id,
                    inv.currency_id as currency_id,
                    '' as product_list,

                    pt.credit_product as journal_id

                FROM account_invoice_line as inv_line
                    LEFT JOIN product_product pp ON (pp.id=inv_line.product_id)
                    LEFT JOIN product_template pt ON (pt.id=pp.product_tmpl_id)
                    LEFT JOIN account_invoice inv ON (inv.id=inv_line.invoice_id)
                    LEFT JOIN account_journal journal ON (journal.id=pt.credit_product)
                WHERE
                    journal.debt=true
                    AND inv.state in ('paid')
                )
                UNION ALL
                (
                --
                -- Manual Credit Updates
                --
                SELECT
                    (-2147483647 + record.id) as id,
                    record.order_id as order_id,
                    NULL::integer as invoice_id,
                    NULL::integer as payment_id,
                    record.id as update_id,
                    record.balance as balance,
                    record.state as state,
                    false as credit_product,

                    record.date as date,
                    record.partner_id as partner_id,
                    record.user_id as user_id,
                    NULL::integer as session_id,
                    record.config_id as config_id,
                    record.company_id as company_id,
                    record.currency_id as currency_id,
                    record.note as product_list,
                    record.journal_id as journal_id

                FROM pos_credit_update as record
                WHERE
                    record.state in ('confirm')
                )
                UNION ALL
                (
                --
                -- Invoices paid by credit journal
                --
                SELECT
                    (-1073741823 - pay.id) as id,
                    NULL::integer as order_id,
                    NULL::integer as invoice_id,
                    pay.id as payment_id,
                    NULL::integer as update_id,
                    -pay.amount as balance,
                    'confirm' as state,
                    false as credit_product,

                    pay.payment_date as date,
                    pay.partner_id as partner_id,
                    NULL::integer as user_id,
                    NULL::integer as session_id,
                    NULL::integer as config_id,
                    pay.company_id as company_id,
                    pay.currency_id as currency_id,
                    '' as product_list,

                    pay.journal_id as journal_id

                FROM account_payment as pay
                    LEFT JOIN account_journal journal ON (journal.id=pay.journal_id)
                WHERE
                    journal.debt=true
                    AND pay.state != 'cancelled'
                    AND pay.has_invoices = true
                )
            )
        """)
