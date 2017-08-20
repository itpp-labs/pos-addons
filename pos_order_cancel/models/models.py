# -*- coding: utf-8 -*-
from odoo import fields, models, api
from functools import partial
from datetime import datetime
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT as DF


class PosCancelledReason(models.Model):
    _name = "pos.cancelled_reason"

    sequence = fields.Integer(string="Sequence")
    name = fields.Char(string="Reason")


class PosOrder(models.Model):
    _inherit = "pos.order"

    cancellation_reason = fields.Text(string="Order Cancellation Reason")
    is_cancelled = fields.Boolean("Stage Cancelled", default=False)
    canceled_lines = fields.One2many("pos.order.line.canceled", "order_id", string="Canceled Lines")
    computed_state = fields.Selection(
        [('draft', 'New'), ('cancel', 'Cancelled'), ('paid', 'Paid'), ('done', 'Posted'), ('invoiced', 'Invoiced')],
        'Status', compute='_compute_state')

    @api.depends('is_cancelled', 'state')
    def _compute_state(self):
        for pos_order in self:
            if pos_order.is_cancelled and (pos_order.state == 'paid' or pos_order.state == 'done'):
                if pos_order.computed_state is not 'Cancelled':
                    pos_order.computed_state = 'cancel'
            else:
                pos_order.computed_state = pos_order.state

    @api.model
    def _order_fields(self, ui_order):
        order = super(PosOrder, self)._order_fields(ui_order)
        process_canceled_line = partial(self.env['pos.order.line.canceled']._order_cancel_line_fields)
        order['canceled_lines'] = [process_canceled_line(l) for l in ui_order['canceled_lines']] if ui_order['canceled_lines'] else False
        return order

    @api.model
    def _process_order(self, pos_order):
        order = super(PosOrder, self)._process_order(pos_order)
        if 'is_cancelled' in pos_order and pos_order['is_cancelled'] is True:
            order.cancellation_reason = pos_order['reason'].encode('utf-8').strip(" \t\n")
            order.is_cancelled = True
        return order

    def _create_account_move_line(self, session=None, move=None):
        uncanceled_order = self.filtered(lambda o: not o.is_cancelled)
        return super(PosOrder, uncanceled_order)._create_account_move_line(session, move)

    @api.multi
    def action_pos_order_paid(self):
        if not self.is_cancelled:
            return super(PosOrder, self).action_pos_order_paid()
        else:
            self.write({'state': 'paid'})
            return True

    @api.multi
    def action_pos_order_done(self):
        if self.is_cancelled:
            self.write({'state': 'done'})
            return True
        else:
            return super(PosOrder, self).action_pos_order_done()


class PosOrderLineCanceled(models.Model):
    _name = "pos.order.line.canceled"
    _rec_name = "product_id"

    def _order_cancel_line_fields(self, line):
        if line and 'tax_ids' not in line[2]:
            product = self.env['product.product'].browse(line[2]['product_id'])
            line[2]['tax_ids'] = [(6, 0, [x.id for x in product.taxes_id])]
        return line

    product_id = fields.Many2one('product.product', string='Product', domain=[('sale_ok', '=', True)], required=True, change_default=True, readonly=True)
    discount = fields.Float(string='Discount (%)', digits=0, default=0.0, readonly=True)
    price_unit = fields.Float(string='Unit Price', digits=0, readonly=True)
    user_id = fields.Many2one(comodel_name='res.users', string='Salesman', help="Person who removed order line", default=lambda self: self.env.uid, readonly=True)
    qty = fields.Float('Quantity', default=1, readonly=True)
    reason = fields.Text(string="The Reason of Line Canceled", readonly=True)
    order_id = fields.Many2one('pos.order', string='Order Ref', ondelete='cascade', readonly=True)
    pack_lot_ids = fields.One2many('pos.pack.operation.lot', 'pos_order_line_id', string='Lot/serial Number', readonly=True)
    tax_ids = fields.Many2many('account.tax', string='Taxes', readonly=True)
    canceled_date = fields.Datetime(string='Canceled Date', readonly=True, default=fields.Datetime.now)

    @api.model
    def create(self, values):
        if values.get('canceled_date'):
            canceled_date = datetime.strptime(values.get('canceled_date'), "%d/%m/%Y %H:%M:%S")
            values['canceled_date'] = canceled_date.strftime(DF)
        return super(PosOrderLineCanceled, self).create(values)
