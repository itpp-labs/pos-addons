# -*- coding: utf-8 -*-
# Copyright 2018 Artyom Losev
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import api, models, fields

SO_CHANNEL = 'pos_sale_orders'
INV_CHANNEL = 'pos_invoices'


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def create_from_ui(self, orders):
        invoices_to_pay = [o for o in orders if o.get('data').get('invoice_to_pay')]
        original_orders = [o for o in orders if o not in invoices_to_pay]
        res = super(PosOrder, self).create_from_ui(original_orders)
        if invoices_to_pay:
            for inv in invoices_to_pay:
                self.process_invoice_payment(inv)
        return res

    @api.model
    def process_invoice_payment(self, invoice):
        for statement in invoice['data']['statement_ids']:
            inv_id = invoice['data']['invoice_to_pay']['id']
            inv_obj = self.env['account.invoice'].search([('id', '=', inv_id)])
            journal_id = statement[2]['journal_id']
            journal = self.env['account.journal'].search([('id', '=', journal_id)])
            amount = statement[2]['amount']
            cashier = invoice['data']['user_id']
            writeoff_acc_id = False
            payment_difference_handling = 'open'

            vals = {
                'journal_id': journal.id,
                'payment_method_id': 1,
                'payment_date': invoice['data']['creation_date'],
                'communication': invoice['data']['invoice_to_pay']['number'],
                'invoice_ids': [(4, inv_id, None)],
                'payment_type': 'inbound',
                'amount': amount,
                'currency_id': inv_obj.currency_id.id,
                'partner_id': invoice['data']['invoice_to_pay']['partner_id'][0],
                'partner_type': 'customer',
                'payment_difference_handling': payment_difference_handling,
                'writeoff_account_id': writeoff_acc_id,
                'paid_by_pos': True,
                'cashier': cashier
            }
            payment = self.env['account.payment'].create(vals)
            payment.post()

    @api.model
    def process_invoices_creation(self, sale_order_id):
        order = self.env['sale.order'].browse(sale_order_id)
        inv_id = order.action_invoice_create()
        self.env['account.invoice'].browse(inv_id).action_invoice_open()
        return inv_id


class AccountPayment(models.Model):
    _inherit = 'account.payment'

    paid_by_pos = fields.Boolean(default=False)
    cashier = fields.Many2one('res.users')


class AccountInvoice(models.Model):
    _inherit = 'account.invoice'

    def action_updated_invoice(self):
        message = {'channel': INV_CHANNEL, 'id': self.id}
        self.env['pos.config'].search([])._send_to_channel(INV_CHANNEL, message)

    @api.model
    def get_invoice_lines_for_pos(self, invoice_ids):
        res = []
        invoice_lines = self.env['account.invoice.line'].search([('invoice_id', 'in', invoice_ids)])
        for l in invoice_lines:
            line = {
                'invoice_id': l.invoice_id.id,
                'id': l.id,
                'name': l.name,
                'account': l.account_id.name,
                'product': l.product_id.name,
                'price_unit': l.price_unit,
                'qty': l.quantity,
                'tax': l.invoice_line_tax_ids.name or ' ',
                'discount': l.discount,
                'amount': l.price_subtotal
            }
            res.append(line)
        return res

    @api.depends('payment_move_line_ids.amount_residual')
    def _get_payment_info_JSON(self):
        if self.payment_move_line_ids:
            for move in self.payment_move_line_ids:
                if move.payment_id.cashier:
                    if move.move_id.ref:
                        move.move_id.ref = "%s by %s" % (move.move_id.ref, move.payment_id.cashier.name)
                    else:
                        move.move_id.name = "%s by %s" % (move.move_id.name, move.payment_id.cashier.name)
        data = super(AccountInvoice, self)._get_payment_info_JSON()
        return data


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def action_updated_sale_order(self):
        message = {'channel': SO_CHANNEL, 'id': self.id}
        self.env['pos.config'].search([])._send_to_channel(SO_CHANNEL, message)

    @api.model
    def get_order_lines_for_pos(self, sale_order_ids):
        res = []
        order_lines = self.env['sale.order.line'].search([('order_id', 'in', sale_order_ids)])
        for l in order_lines:
            line = {
                'order_id': l.order_id.id,
                'id': l.id,
                'name': l.name,
                'product': l.product_id.name,
                'uom_qty': l.product_uom_qty,
                'qty_delivered': l.qty_delivered,
                'qty_invoiced': l.qty_invoiced,
                'tax': l.tax_id.name or ' ',
                'discount': l.discount,
                'subtotal': l.price_subtotal,
                'total': l.price_total,
                'invoiceble': ((l.qty_delivered > 0) or (l.product_id.invoice_policy == 'order'))
            }
            res.append(line)
        return res


class PosConfig(models.Model):
    _inherit = 'pos.config'

    show_invoices = fields.Boolean(string="Show Invoices in POS", help="Fetch and pay regular invoices", default=True)
    show_sale_orders = fields.Boolean(string="Show Sale Orders in POS", help="Fetch and pay sale orders", default=True)
    invoice_cashier_selection = fields.Boolean(string='Select Invoice Cashier', help='Ask for a cashier when fetch invoices', defaul=True)
    sale_order_cashier_selection = fields.Boolean(string='Select Sale Order Cashier', help='Ask for a cashier when fetch orders', defaul=True)
