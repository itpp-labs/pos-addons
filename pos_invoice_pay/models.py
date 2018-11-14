# Copyright 2017 Artyom Losev
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import api, models, fields, _

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
            inv_obj = self.env['account.invoice'].browse(inv_id)
            journal_id = statement[2]['journal_id']
            journal = self.env['account.journal'].browse(journal_id)
            amount = statement[2]['amount']
            cashier = invoice['data']['user_id']
            writeoff_acc_id = False
            payment_difference_handling = 'open'
            if amount > inv_obj.residual:
                session_id = self.env['pos.session'].browse(invoice['data']['pos_session_id'])
                writeoff_acc_id = session_id.config_id.pos_invoice_pay_writeoff_account_id.id
                payment_difference_handling = 'reconcile'

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
                'pos_session_id': invoice['data']['pos_session_id'],
                'cashier': cashier,
            }
            payment = self.env['account.payment'].create(vals)
            payment.post()

    @api.model
    def process_invoices_creation(self, sale_order_id, session_id):
        order = self.env['sale.order'].browse(sale_order_id)
        inv_id = order.action_invoice_create()
        self.env['account.invoice'].browse(inv_id).action_invoice_open()
        return inv_id


class AccountPayment(models.Model):
    _inherit = 'account.payment'

    pos_session_id = fields.Many2one('pos.session', string='POS session')
    cashier = fields.Many2one('res.users')
    datetime = fields.Datetime(string="Datetime", default=fields.Datetime.now)


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

    def _get_default_writeoff_account(self):
        acc = self.env['account.account'].search([('code', '=', 220000)]).id
        return acc if acc else False

    show_invoices = fields.Boolean(help="Show invoices in POS", default=True)
    show_sale_orders = fields.Boolean(help="Show sale orders in POS", default=True)
    pos_invoice_pay_writeoff_account_id = fields.Many2one('account.account', string="Difference Account",
                                                          help="The account is used for the difference between due and paid amount",
                                                          default=_get_default_writeoff_account)
    invoice_cashier_selection = fields.Boolean(string='Select Invoice Cashier',
                                               help='Ask for a cashier when fetch invoices', defaul=True)
    sale_order_cashier_selection = fields.Boolean(string='Select Sale Order Cashier',
                                                  help='Ask for a cashier when fetch orders', defaul=True)


class PosSession(models.Model):
    _inherit = 'pos.session'

    session_payments = fields.One2many('account.payment', 'pos_session_id',
                                       string='Invoice Payments', help="Show invoices paid in the Session")
    session_invoices_total = fields.Float('Invoices', compute='_compute_session_invoices_total')

    @api.multi
    def _compute_session_invoices_total(self):
        for rec in self:
            rec.session_invoices_total = sum(rec.session_payments.mapped('invoice_ids').mapped('amount_total') + [0])

    @api.multi
    def action_invoice_payments(self):
        payments = self.env['account.payment'].search([('pos_session_id', 'in', self.ids)])
        invoices = payments.mapped('invoice_ids').ids
        domain = [('id', 'in', invoices)]
        return {
            'name': _('Invoice Payments'),
            'type': 'ir.actions.act_window',
            'domain': domain,
            'res_model': 'account.invoice',
            'view_type': 'form',
            'view_mode': 'tree,form',
        }
