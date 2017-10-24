# -*- coding: utf-8 -*-
from odoo import api, models


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def create_from_ui(self, orders):
        invoices_to_pay = [o for o in orders if o.get('data').get('invoice_to_pay')]
        original_orders = [o for o in orders if o not in invoices_to_pay]
        res = super(PosOrder, self).create_from_ui(original_orders)
        if invoices_to_pay:
            ids = map(self.process_invoice_payment, invoices_to_pay)
        return res

    @api.model
    def process_invoice_payment(self, invoice):
        for statement in invoice['data']['statement_ids']:
            inv_id = invoice['data']['invoice_to_pay']['id']
            inv_obj = self.env['account.invoice'].search([('id', '=', inv_id)])
            journal_id = statement[2]['journal_id']
            journal = self.env['account.journal'].search([('id', '=', journal_id)])
            vals = {
                'journal_id': journal.id,
                'payment_method_id': 1,
                'payment_date': invoice['data']['creation_date'],
                'communication': invoice['data']['invoice_to_pay']['number'],
                'invoice_ids': (4, inv_id, None),
                'payment_type': 'inbound',
                'amount': statement[2]['amount'],
                'currency_id': inv_obj.currency_id.id,
                'partner_id': invoice['data']['invoice_to_pay']['partner_id'][0],
                'partner_type': 'customer',
            }
            payment = self.env['account.payment'].create(vals)
            payment.post()
            credit_aml_id = filter(lambda x: x.credit > 0, payment.move_line_ids)[0]
            inv_obj.assign_outstanding_credit(credit_aml_id.id)

    @api.model
    def process_invoices_creation(self, sale_order_id):
        return self.env['sale.order'].browse(sale_order_id).action_invoice_create()[0]

    @api.model
    def send_longpolling_data(self):
        return {
            'dbname': self._cr.dbname,
            'uid': self.env.uid
        }


class AccountInvoice(models.Model):
    _inherit = 'account.invoice'

    def action_updated_invoice(self):
        channel = '["%s","%s","%s"]' % (self._cr.dbname, "account.invoice", self.env.uid)
        self.env['bus.bus'].sendone(channel, self.id)

    @api.model
    def get_invoice_lines_for_pos(self, invoice_ids):
        res = []
        invoice_lines = self.env['account.invoice.line'].search([('invoice_id', 'in', invoice_ids)])
        for inv in invoice_lines:
            line = {
                'invoice_id': inv.invoice_id.id,
                'id': inv.id,
                'name': inv.name,
                'account': inv.account_id.name,
                'product': inv.product_id.name,
                'price_unit': inv.price_unit,
                'qty': inv.quantity,
                'tax': inv.invoice_line_tax_ids.name or ' ',
                'amount': inv.price_subtotal
            }
            res.append(line)
        return res


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def action_updated_sale_order(self):
        channel = '["%s","%s","%s"]' % (self._cr.dbname, "sale.order", self.env.uid)
        self.env['bus.bus'].sendone(channel, self.id)

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
                'subtotal': l.price_subtotal,
                'total': l.price_total
            }
            res.append(line)
        return res
