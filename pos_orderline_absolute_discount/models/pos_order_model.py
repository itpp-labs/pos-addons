# -*- coding: utf-8 -*-
import logging
from odoo import api, models, fields, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def _amount_line_tax(self, line, fiscal_position_id):
        if line.absolute_discount:
            taxes = line.tax_ids.filtered(lambda t: t.company_id.id == line.order_id.company_id.id)
            if fiscal_position_id:
                taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.order_id.partner_id)
            price = line.price_unit - line.absolute_discount
            taxes = taxes.compute_all(price, line.order_id.pricelist_id.currency_id, line.qty, product=line.product_id, partner=line.order_id.partner_id or False)['taxes']
            return sum(tax.get('amount', 0.0) for tax in taxes)
        else:
            return super(PosOrder, self)._amount_line_tax(line, fiscal_position_id)


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    absolute_discount = fields.Float(string='Discount per Unit (abs)', default=0.0)

    @api.depends('price_unit', 'tax_ids', 'qty', 'discount', 'product_id', 'absolute_discount')
    def _compute_amount_line_all(self):
        super(PosOrderLine, self)._compute_amount_line_all()
        for line in self:
            fpos = line.order_id.fiscal_position_id
            tax_ids_after_fiscal_position = fpos.map_tax(line.tax_ids, line.product_id, line.order_id.partner_id) if fpos else line.tax_ids
            if line.absolute_discount:
                price = line.price_unit - line.absolute_discount
                taxes = tax_ids_after_fiscal_position.compute_all(price, line.order_id.pricelist_id.currency_id, line.qty, product=line.product_id, partner=line.order_id.partner_id)
                line.update({
                    'price_subtotal_incl': taxes['total_included'],
                    'price_subtotal': taxes['total_excluded'],
                })

    @api.onchange('qty', 'discount', 'price_unit', 'tax_ids', 'absolute_discount')
    def _onchange_qty(self):
        if self.product_id and self.absolute_discount:
            if not self.order_id.pricelist_id:
                raise UserError(_('You have to select a pricelist in the sale form !'))
            price = self.price_unit - self.absolute_discount
            self.price_subtotal = self.price_subtotal_incl = price * self.qty
            if (self.product_id.taxes_id):
                taxes = self.product_id.taxes_id.compute_all(price, self.order_id.pricelist_id.currency_id, self.qty, product=self.product_id, partner=False)
                self.price_subtotal = taxes['total_excluded']
                self.price_subtotal_incl = taxes['total_included']
        else:
            super(PosOrderLine, self)._onchange_qty()
