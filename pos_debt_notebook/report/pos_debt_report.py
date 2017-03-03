# -*- coding: utf-8 -*-
from openerp import models, tools, fields


class PosDebtReport(models.Model):

    _name = "report.pos.debt"
    _inherit = ['base_groupby_extra']
    _description = "POS Debt Statistics"
    _auto = False
    _order = 'date desc'

    order_id = fields.Many2one('pos.order', string='Order', readonly=True)

    date = fields.Datetime(string='Date', readonly=True)
    partner_id = fields.Many2one('res.partner', string='Partner', readonly=True)
    user_id = fields.Many2one('res.users', string='Salesperson', readonly=True)
    session_id = fields.Many2one('pos.session', string='Session', readonly=True)
    config_id = fields.Many2one('pos.config', string='POS', readonly=True)
    company_id = fields.Many2one('res.company', string='Company', readonly=True)
    currency_id = fields.Many2one('res.currency', string='Currency', readonly=True)

    state = fields.Selection([('open', 'Open'), ('confirm', 'Validated')], readonly=True)
    credit_product = fields.Boolean('Credit Product', help="Record is registered as Purchasing credit product", readonly=True)
    balance = fields.Monetary('Balance', help="Negative value for purchases without money (debt). Positive for credit payments (prepament or payments for debts).", readonly=True)

    def init(self, cr):
        tools.drop_view_if_exists(cr, 'report_pos_debt')
        cr.execute("""
            CREATE OR REPLACE VIEW report_pos_debt AS (
                (
                SELECT
                    st_line.id as id,
                    o.id as order_id,
                    -st_line.amount as balance,
                    st.state as state,
                    false as credit_product,

                    o.date_order as date,
                    o.partner_id as partner_id,
                    o.user_id as user_id,
                    o.session_id as session_id,
                    session.config_id as config_id,
                    o.company_id as company_id,
                    pricelist.currency_id as currency_id

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
                SELECT
                    -pos_line.id as id,
                    o.id as order_id,
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
                    pricelist.currency_id as currency_id

                FROM pos_order_line as pos_line
                    LEFT JOIN product_product pp ON (pp.id=pos_line.product_id)
                    LEFT JOIN product_template pt ON (pt.id=pp.product_tmpl_id)

                    LEFT JOIN pos_order o ON (o.id=pos_line.order_id)

                    LEFT JOIN pos_session session ON (session.id=o.session_id)
                    LEFT JOIN product_pricelist pricelist ON (pricelist.id=o.pricelist_id)
                WHERE
                    pt.credit_product=true
                    AND o.state IN ('paid','done')

                )
            )
        """)
