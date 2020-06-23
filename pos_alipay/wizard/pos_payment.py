# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import api, fields, models


class PosMakePayment(models.TransientModel):
    _inherit = "pos.make.payment"

    journal_alipay = fields.Selection(related="journal_id.alipay")
    alipay_order_id = fields.Many2one("alipay.order", string="Alipay Order to refund")

    def check(self):
        res = super(PosMakePayment, self).check()
        record = self.alipay_order_id
        if record and self.amount < 0:
            refund_amount = self.amount
            refund_vals = {
                "order_id": self.alipay_order_id.id,
                "total_amount": record.total_amount,
                "refund_amount": refund_amount,
                "journal_id": self.journal_id.id,
            }
            refund = self.env["alipay.refund"].create(refund_vals)
            refund.action_confirm()
        return res

    @api.onchange("order_ref", "journal_id")
    def update_alipay_order(self):
        if self.journal_alipay:
            self.alipay_order_id = self.env["alipay.order"].search(
                [
                    ("order_ref", "=", self.order_ref),
                    ("journal_id", "=", self.journal_id.id),
                ]
            )[:1]
