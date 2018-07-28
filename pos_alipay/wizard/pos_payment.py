# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields


class PosMakePayment(models.TransientModel):
    _inherit = 'pos.make.payment'

    journal_alipay = fields.Selection(related='journal_id.alipay')
    order_ref = fields.Char(compute='_compute_order_ref')
    alipay_order_id = fields.Many2one('alipay.order', string='Alipay Order to refund')

    def _compute_order_ref(self):
        order = self.env['pos.order'].browse(self.env.context.get('active_id', False))
        if order:
            for r in self:
                r.order_ref = order.pos_reference_uid

    def check(self):
        res = super(PosMakePayment, self).check()
        record = self.alipay_order_id
        if record and self.amount < 0:
            refund_amount = self.amount
            refund_vals = {
                'order_id': self.alipay_order_id.id,
                'total_amount': record.total_amount,
                'refund_amount': refund_amount,
                'journal_id': self.journal_id.id,
            }
            refund = self.env['alipay.refund'].create(refund_vals)
            refund.action_confirm()
        return res
