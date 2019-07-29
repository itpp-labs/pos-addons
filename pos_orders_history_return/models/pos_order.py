# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import models, api, fields, tools, _
from odoo.tools import float_is_zero
import psycopg2
import logging

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = "pos.order"

    returned_order = fields.Boolean('Returned Order', default=False)

    @api.model
    def create_from_ui(self, orders):
        # Keep return orders
        submitted_references = [o['data']['name'] for o in orders]
        pos_order = self.search([('pos_reference', 'in', submitted_references)])
        existing_orders = pos_order.read(['pos_reference'])
        existing_references = set([o['pos_reference'] for o in existing_orders])
        orders_to_save = [o for o in orders if o['data']['name'] in existing_references]

        pos_retuned_orders = [o for o in orders_to_save if o['data'].get('mode') and o['data'].get('mode') == 'return']
        self.return_from_ui(pos_retuned_orders)
        return super(PosOrder, self).create_from_ui(orders)

    @api.multi
    def return_from_ui(self, orders):
        for tmp_order in orders:
            # eliminates the return of the order several times at the same time
            returned_order = self.search([('pos_reference', '=', tmp_order['data']['name']),
                                          ('date_order', '=', tmp_order['data']['creation_date']),
                                          ('returned_order', '=', True)])
            if not returned_order:
                to_invoice = tmp_order['to_invoice']
                order = tmp_order['data']
                if to_invoice:
                    self._match_payment_to_invoice(order)

                order['returned_order'] = True
                pos_order = self._process_order(order)

                try:
                    pos_order.action_pos_order_paid()
                except psycopg2.OperationalError:
                    raise
                except Exception as e:
                    _logger.error('Could not fully process the POS Order: %s', tools.ustr(e))

                if to_invoice:
                    pos_order.action_pos_order_invoice()
                    pos_order.invoice_id.sudo().action_invoice_open()
                    pos_order.account_move = pos_order.invoice_id.move_id

    @api.model
    def _process_order(self, pos_order):
        if pos_order.get('returned_order'):
            prec_acc = self.env['decimal.precision'].precision_get('Account')
            pos_session = self.env['pos.session'].browse(pos_order['pos_session_id'])
            if pos_session.state == 'closing_control' or pos_session.state == 'closed':
                pos_order['pos_session_id'] = self._get_valid_session(pos_order).id
            order = self.create(self._order_fields(pos_order))
            order.write({'returned_order': True})
            journal_ids = set()
            for payments in pos_order['statement_ids']:
                if not float_is_zero(payments[2]['amount'], precision_digits=prec_acc):
                    order.add_payment(self._payment_fields(payments[2]))
                journal_ids.add(payments[2]['journal_id'])
            if pos_session.sequence_number <= pos_order['sequence_number']:
                pos_session.write({'sequence_number': pos_order['sequence_number'] + 1})
                pos_session.refresh()
            if not float_is_zero(pos_order['amount_return'], prec_acc):

                cash_journal_id = pos_session.cash_journal_id.id
                if not cash_journal_id:
                    cash_journal = self.env['account.journal'].search([('id', 'in', list(journal_ids))], limit=1)
                    if not cash_journal:
                        cash_journal = [statement.journal_id for statement in pos_session.statement_ids]
                    cash_journal_id = cash_journal[0].id
                order.add_payment({
                    'amount': -pos_order['amount_return'],
                    'payment_date': fields.Datetime.now(),
                    'payment_name': _('return'),
                    'journal': cash_journal_id,
                })
            return order
        else:
            return super(PosOrder, self)._process_order(pos_order)
