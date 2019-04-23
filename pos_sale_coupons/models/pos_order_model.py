from odoo import models, fields, api


class PosOrder(models.Model):
    _inherit = 'pos.order'

    coupon_ids = fields.One2many('sale.coupon', 'pos_order_id', string="Coupons")


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    @api.model
    def create(self, vals):
        res = super(PosOrderLine, self).create(vals)
        if vals.get('coupon_id'):
            coupon = self.env['sale.coupon'].browse(vals.get('coupon_id'))
            if vals.get('coupon_state') == 'sold':
                # coupon sold
                coupon.write({
                    'state': 'reserved',
                    'partner_id': res.order_id.partner_id.id if res.order_id.partner_id else False,
                    'sold_via_order_id': res.order_id.id
                })
            elif vals.get('coupon_state') == 'consumed':
                # coupon consumed
                coupon.write({
                    'state': 'used',
                    'pos_order_id': res.order_id.id
                })
        return res
