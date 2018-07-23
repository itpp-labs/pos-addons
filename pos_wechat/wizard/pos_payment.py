# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import models, api, fields


class PosMakePayment(models.TransientModel):
    _inherit = 'pos.make.payment'

    journal_wechat = fields.Selection(related='journal_id.wechat')
    order_ref = fields.Char(compute='_compute_order_ref')
    wechat_order_id = fields.Many2one('wechat.order', string='WeChat Order to refund')
    micropay_id = fields.Many2one('wechat.micropay', string='Micropay to refund')

    def _compute_order_ref(self):
        order = self.env['pos.order'].browse(self.env.context.get('active_id', False))
        if order:
            for r in self:
                r.order_ref = order.pos_reference_uid

    def check(self):
        res = super(PosMakePayment, self).check()
        record = self.wechat_order_id or self.micropay_id
        if record and self.amount < 0:
            refund_fee = int(-100*self.amount)
            refund_vals = {
                'order_id': self.wechat_order_id.id,
                'micropay_id': self.micropay_id.id,
                'total_fee': record.total_fee,
                'refund_fee': refund_fee,
                'journal_id': self.journal_id.id,
            }
            refund = self.env['wechat.refund'].create(refund_vals)
            refund.action_confirm()
        return res
