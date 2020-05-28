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
                updated_coupon_vals = {}
                if vals.get('coupon_value'):
                    updated_coupon_vals['program_id'] = self.process_new_program(coupon, vals.get('coupon_value')).id
                updated_coupon_vals.update({
                    'state': 'reserved',
                    'partner_id': res.order_id.partner_id.id if res.order_id.partner_id else False,
                    'sold_via_order_id': res.order_id.id
                })
                # coupon sold
                coupon.write(updated_coupon_vals)
            elif vals.get('coupon_state') == 'consumed':
                # coupon consumed
                coupon.write({
                    'state': 'used',
                    'pos_order_id': res.order_id.id
                })
        return res

    @api.model
    def process_new_program(self, coupon, value):
        base_prog = coupon.program_id
        current_prog = base_prog.search([('parented_storage_program', '=',  base_prog.id),
                                         ('discount_fixed_amount', '=', float(value))], limit=1)
        if not current_prog:
            name = base_prog.name + ': ' + str(value)
            discount_line_product_id = self.env['product.product'].create({
                'name': name,
                'type': 'service',
                'taxes_id': False,
                'supplier_taxes_id': False,
                'sale_ok': False,
                'purchase_ok': False,
                'invoice_policy': 'order',
                'lst_price': -1000000,
                # Prevent pricelist strikethrough as negative value will always be lower then default 1$
            })
            current_prog = base_prog.copy({
                'name': name,
                'is_code_storage_program': False,
                'parented_storage_program': base_prog.id,
                'discount_fixed_amount': float(value),
                'discount_line_product_id': discount_line_product_id.id
            })
        return current_prog
