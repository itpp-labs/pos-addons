# -*- coding: utf-8 -*-
from odoo import api, models

class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def create_from_ui(self, orders):
        invoices_to_pay = [o for o in orders if o.get('data').get('invoice_to_pay')]
        original_orders = [o for o in orders if o not in invoices_to_pay]
        if invoices_to_pay:
            ids = map(self.process_invoice_payment, invoices_to_pay)
        return super(PosOrder, self).create_from_ui(original_orders)

    @api.model
    def process_invoice_payment(self, invoice):
        for statement in invoice['data']['statement_ids']:
            inv_id = invoice['data']['invoice_to_pay']['id']
            inv_obj = self.env['account.invoice'].search([('id', '=', inv_id)])
            journal_id = statement[2]['journal_id']
            journal = self.env['account.journal'].search([('id', '=', journal_id)])
            currency_id = inv_obj.currency_id
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
            credit_aml_id = filter(lambda x: x.credit>0, payment.move_line_ids)[0]
            inv_obj.assign_outstanding_credit(credit_aml_id.id)

    @api.model
    def process_invoices_creation(self, sale_order_id):
        return self.env['sale.order'].browse(sale_order_id).action_invoice_create()[0]
