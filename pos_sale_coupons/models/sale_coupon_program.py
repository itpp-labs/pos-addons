from odoo import fields, models, api, _


CHANNEL = 'pos_sale_coupons'


class SaleCouponProgram(models.Model):
    _inherit = 'sale.coupon.program'

    pos_product_id = fields.Many2one('product.product', string='POS Product',
                                     domain="[('available_in_pos', '=', True), ('sale_ok', '=', True)]",
                                     help='The product used to model the discount.')
    force_sale_before_consumption = fields.Boolean(string="Force sale the coupon", default=True,
                                                   help="Force sale the coupons before consumption"
                                                        "(for POS only)")
    pos_order_count = fields.Integer(compute='_compute_pos_order_count')

    @api.depends('coupon_ids.pos_order_id')
    def _compute_order_count(self):
        for program in self:
            orders = program.coupon_ids.filtered(lambda c: c.pos_order_id is not False).mapped('pos_order_id')
            program.pos_order_count = len(orders) or 0

    def action_view_pos_orders(self):
        self.ensure_one()
        orders = self.coupon_ids.filtered(lambda c: c.pos_order_id is not False).mapped('pos_order_id')
        return {
            'name': _('POS Orders'),
            'view_mode': 'tree,form',
            'res_model': 'pos.order',
            'type': 'ir.actions.act_window',
            'domain': [('id', 'in', orders.ids)]
        }


class SaleCoupon(models.Model):
    _inherit = 'sale.coupon'
    pos_discount_line_product_id = fields.Many2one('product.product', related='program_id.pos_product_id',
                                                   readonly=False,
                                                   help='Product used in the sales order to apply the discount.')
    pos_order_id = fields.Many2one('pos.order', 'Applied on POS order', readonly=True,
                                   help="The POS order on which the coupon is applied")
    sold_via_order_id = fields.Many2one('pos.order', string='Sold via', readonly=True,
                                        help="The POS order on which the coupon is sold")

    def action_updated_coupon(self):
        message = {'channel': CHANNEL, 'data': self.read(['code', 'expiration_date', 'state', 'partner_id', 'pos_order_id', 'pos_discount_line_product_id', 'sold_via_order_id', 'program_id'])}
        self.env['pos.config'].search([])._send_to_channel(CHANNEL, message)
