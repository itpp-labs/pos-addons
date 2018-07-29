# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields, api


class PosMakePayment(models.TransientModel):
    _inherit = 'pos.make.payment'

    journal_wechat = fields.Selection(related='journal_id.wechat')
    wechat_order_id = fields.Many2one('wechat.order', string='WeChat Order to refund')
    micropay_id = fields.Many2one('wechat.micropay', string='Micropay to refund')

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

    @api.onchange('order_ref', 'journal_wechat')
    def update_wechat_order(self):
        domain = [('order_ref', '=', self.order_ref)]
        if self.journal_wechat == 'micropay':
            record = self.env['wechat.micropay'].search(domain)[:1]
            self.wechat_order_id = False
            self.micropay_id = record
        elif self.journal_wechat == 'native':
            record = self.env['wechat.order'].search(domain)[:1]
            self.wechat_order_id = record
            self.micropay_id = False
