# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import models, api, fields


class PosMakePayment(models.TransientModel):
    _inherit = 'pos.make.payment'

    wechat_order_id = fields.Many2one('wechat.order', string='WeChat Order to refund')

    def check(self):
        res = super(PosMakePayment, self).check()
        refund_fee = int(100*self.amount)
        refund_vals = {
            'order_id': self.wechat_order_id.id,
            'total_fee': self.wechat_order_id.total_fee,
            'refund_fee': refund_fee,
        }
        refund = self.env['wechat.refund'].create(refund_vals)
        refund.action_confirm()
        return res
