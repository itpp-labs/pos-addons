# -*- coding: utf-8 -*-
import logging
from odoo import api, models, fields, _
from odoo.exceptions import UserError
import pytz
from datetime import timedelta

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


class ReportSaleDetails(models.AbstractModel):
    _inherit = 'report.point_of_sale.report_saledetails'

    @api.model
    def get_sale_details(self, date_start=False, date_stop=False, configs=False):
        """ Serialise the orders of the day information

        params: date_start, date_stop string representing the datetime of order
        """
        if not configs:
            configs = self.env['pos.config'].search([])

        user_tz = pytz.timezone(self.env.context.get('tz') or self.env.user.tz or 'UTC')
        today = user_tz.localize(fields.Datetime.from_string(fields.Date.context_today(self)))
        today = today.astimezone(pytz.timezone('UTC'))
        if date_start:
            date_start = fields.Datetime.from_string(date_start)
        else:
            # start by default today 00:00:00
            date_start = today

        if date_stop:
            # set time to 23:59:59
            date_stop = fields.Datetime.from_string(date_stop)
        else:
            # stop by default today 23:59:59
            date_stop = today + timedelta(days=1, seconds=-1)

        # avoid a date_stop smaller than date_start
        date_stop = max(date_stop, date_start)

        date_start = fields.Datetime.to_string(date_start)
        date_stop = fields.Datetime.to_string(date_stop)

        orders = self.env['pos.order'].search([
            ('date_order', '>=', date_start),
            ('date_order', '<=', date_stop),
            ('state', 'in', ['paid', 'invoiced', 'done']),
            ('config_id', 'in', configs.ids)])

        user_currency = self.env.user.company_id.currency_id

        total = 0.0
        products_sold = {}
        taxes = {}
        for order in orders:
            if user_currency != order.pricelist_id.currency_id:
                total += order.pricelist_id.currency_id.compute(order.amount_total, user_currency)
            else:
                total += order.amount_total
            currency = order.session_id.currency_id

            for line in order.lines:
                # begin redefined part of original get_sale_details of point_of_sale/models/pos_order.py
                key = (line.product_id, line.price_unit, line.discount)
                key2 = (line.qty or 0, line.absolute_discount or 0)
                products_sold.setdefault(key, key2)

                if line.tax_ids_after_fiscal_position:
                    if line.absolute_discount:
                        line_taxes = line.tax_ids_after_fiscal_position.compute_all(
                            line.price_unit * (1 - line.absolute_discount), currency, line.qty,
                            product=line.product_id, partner=line.order_id.partner_id or False)
                    else:
                        line_taxes = line.tax_ids_after_fiscal_position.compute_all(
                            line.price_unit * (1 - (line.discount or 0.0) / 100.0), currency, line.qty,
                            product=line.product_id, partner=line.order_id.partner_id or False)
                    # end redefined part of original get_sale_details

                    for tax in line_taxes['taxes']:
                        taxes.setdefault(tax['id'], {'name': tax['name'], 'total': 0.0})
                        taxes[tax['id']]['total'] += tax['amount']

        st_line_ids = self.env["account.bank.statement.line"].search([('pos_statement_id', 'in', orders.ids)]).ids
        if st_line_ids:
            self.env.cr.execute("""
                SELECT aj.name, sum(amount) total
                FROM account_bank_statement_line AS absl,
                     account_bank_statement AS abs,
                     account_journal AS aj
                WHERE absl.statement_id = abs.id
                    AND abs.journal_id = aj.id
                    AND absl.id IN %s
                GROUP BY aj.name
            """, (tuple(st_line_ids),))
            payments = self.env.cr.dictfetchall()
        else:
            payments = []

        return {
            'total_paid': user_currency.round(total),
            'payments': payments,
            'company_name': self.env.user.company_id.name,
            'taxes': taxes.values(),
            'products': sorted([{
                'product_id': product.id,
                'product_name': product.name,
                'code': product.default_code,
                'quantity': qty,
                'price_unit': price_unit,
                'discount': discount,
                'absolute_discount': absolute_discount,
                'uom': product.uom_id.name
            } for (product, price_unit, discount), (qty, absolute_discount) in products_sold.items()], key=lambda l: l['product_name'])
        }
