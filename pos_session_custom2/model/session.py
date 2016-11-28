# -*- coding: utf-8 -*-

from openerp import fields, models
from openerp.addons.point_of_sale.wizard.pos_box import PosBox


class PosBoxIn(PosBox):
    _inherit = 'cash.box.in'

    def _compute_values_for_statement_line(self, cr, uid, box, record, context=None):
        values = super(PosBoxIn, self)._compute_values_for_statement_line(cr, uid, box, record, context=context)
        values['is_cash_in'] = True
        return values


class PosBoxOut(PosBox):
    _inherit = 'cash.box.out'

    def _compute_values_for_statement_line(self, cr, uid, box, record, context=None):
        values = super(PosBoxOut, self)._compute_values_for_statement_line(cr, uid, box, record, context=context)
        values['is_cash_out'] = True
        return values


class AccountBankStatementLine(models.Model):
    _inherit = "account.bank.statement.line"


    is_cash_in = fields.Boolean('Cash In')
    is_cash_out = fields.Boolean('Cash Out')

    _defaults = {
        'is_cash_in': False,
        'is_cash_out': False,
    }


class AccountCashStatement(models.Model):

    _inherit = 'account.bank.statement'

    def _get_statement_from_line(self, cr, uid, ids, context=None):
        result = {}
        for line in self.pool.get('account.bank.statement.line').browse(cr, uid, ids, context=context):
            result[line.statement_id.id] = True
        return result.keys()

    def _get_sum_entry_encoding_custom(self, cr, uid, ids, name, arg, context=None):
        """ Find encoding total of statements "
        @param name: Names of fields.
        @param arg: User defined arguments
        @return: Dictionary of values.
        """

        res = {}
        for statement in self.browse(cr, uid, ids, context=context):
            res[statement.id] = sum((line.amount for line in statement.line_ids if not (line.is_cash_in or line.is_cash_out)), 0.0)
        return res

    def _get_sum_entry_encoding_put_in(self, cr, uid, ids, name, arg, context=None):
        """ Find encoding total of statements "
        @param name: Names of fields.
        @param arg: User defined arguments
        @return: Dictionary of values.
        """

        res = {}
        for statement in self.browse(cr, uid, ids, context=context):
            res[statement.id] = sum((line.amount for line in statement.line_ids if line.is_cash_in), 0.0)
        return res

    def _get_sum_entry_encoding_take_out(self, cr, uid, ids, name, arg, context=None):
        """ Find encoding total of statements "
        @param name: Names of fields.
        @param arg: User defined arguments
        @return: Dictionary of values.
        """

        res = {}
        for statement in self.browse(cr, uid, ids, context=context):
            res[statement.id] = sum((line.amount for line in statement.line_ids if line.is_cash_out), 0.0)
        return res


    total_entry_encoding_custom = fields.Float(compute=_get_sum_entry_encoding_custom, string="Total Transactions",
                                                       store={
                                                           'account.bank.statement': (lambda self, cr, uid, ids, context=None: ids, ['line_ids', 'move_line_ids'], 10),
                                                           'account.bank.statement.line': (_get_statement_from_line, ['amount'], 10),
                                                       },
                                                       help="Total of cash transaction lines.")
    total_entry_encoding_put_in = fields.Float(compute=_get_sum_entry_encoding_put_in, string="Cash put in",
                                                       store={
                                                           'account.bank.statement': (lambda self, cr, uid, ids, context=None: ids, ['line_ids', 'move_line_ids'], 10),
                                                           'account.bank.statement.line': (_get_statement_from_line, ['amount'], 10),
                                                       },
                                                       help="Total of cash transaction lines.")
    total_entry_encoding_take_out = fields.Float(compute=_get_sum_entry_encoding_take_out, string="Cash take out",
                                                         store={
                                                             'account.bank.statement': (lambda self, cr, uid, ids, context=None: ids, ['line_ids', 'move_line_ids'], 10),
                                                             'account.bank.statement.line': (_get_statement_from_line, ['amount'], 10),
                                                         },
                                                         help="Total of cash transaction lines.")


class Sessionpos(models.Model):

    def _fun_difference(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            total = 0
            totali = 0
            totali = session.cash_register_balance_end
            totalf = session.cash_register_balance_end_real
            for order in session.order_ids:
                flag = False
                for producto in order.lines:
                    if producto.product_id.expense_pdt:
                        # print producto.product_id.name
                        flag = True
                if flag:
                    totali -= (order.amount_total * 2)

            total = (totali - totalf)
            res[session.id] = total

            if total < 0:
                total = -total
            else:
                total = -total

            if session.state != 'closed':
                self.write(cr, uid, session.id, {'difference2': total}, context=context)
                self.write(cr, uid, session.id, {'money_close': totali}, context=context)
                self.write(cr, uid, session.id, {'money_reported': totalf}, context=context)
        return res

    def _calc_vb(self, cr, uid, ids, fields, args, context=None):
        res = {}
        flag = False
        for session in self.browse(cr, uid, ids, context=context):
            total = 0
            for order in session.order_ids:
                flag = False
                for producto in order.lines:
                    if producto.product_id.expense_pdt or producto.product_id.income_pdt:
                        flag = True
                if not flag:
                    total += order.amount_total
            res[session.id] = total
        return res

    def _calc_statements_total(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            total = 0
            for st in session.statement_ids:
                total += st.total_entry_encoding_custom
            res[session.id] = total
        return res

    def _calc_isv(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            total = 0
            for order in session.order_ids:
                total += order.amount_tax
            res[session.id] = total
        return res

    def _calc_subtotal(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            total = session.venta_bruta - session.isv
            res[session.id] = total
        return res

    def _calc_no_facturas(self, cr, uid, ids, fields, args, context=None):
        res = {}
        array = []
        count = 0
        for session in self.browse(cr, uid, ids, context=context):
            for order in session.order_ids:
                count += 1
                array.append(order.pos_reference)
            if array:
                res[session.id] = str(count) + " facturas " + str(array[len(array) - 1]) + " A " + str(array[0])

        return res

    def _calc_discount(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            des_total = 0
            for order in session.order_ids:
                discount = 0
                for desc in order.lines:
                    discount += desc.price_unit * (desc.discount / 100)
                des_total += discount
            res[session.id] = des_total
        return res

    def _calc_money_incoming(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            total = 0
            counttotal = 0

            for order in session.order_ids:
                total2 = 0
                count = 0
                for desc in order.lines:
                    if desc.product_id.income_pdt:
                        count += 1
                        total2 += desc.price_subtotal_incl
                total += total2
                counttotal += count
            res[session.id] = str(counttotal) + " Entrada(s) " + " Total Entradas " + str(total)
        return res

    def _calc_money_outgoing(self, cr, uid, ids, fields, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            total = 0
            counttotal = 0
            for order in session.order_ids:
                total2 = 0
                count = 0
                for desc in order.lines:
                    if desc.product_id.expense_pdt:
                        count += 1
                        total2 += desc.price_subtotal_incl
                total += total2
                counttotal += count
            res[session.id] = str(counttotal) + " Salida(s) " + "  Total Salidas " + str(total)
        return res

    def _calc_tickets(self, cr, uid, ids, name, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            res[session.id] = {
                'tickets_num': 0,
                'ticket_first_id': None,
                'ticket_last_id': None,
            }
            if session.order_ids:
                res[session.id]['tickets_num'] = len(session.order_ids)
                res[session.id]['ticket_first_id'] = session.order_ids[-1]
                res[session.id]['ticket_last_id'] = session.order_ids[0]
        return res

    def summary_by_product(self, cr, uid, ids, context=None):
        assert len(ids) == 1, 'This option should only be used for a single id at a time.'
        products = {}  # product_id -> data
        for session in self.browse(cr, uid, ids, context=context):
            for order in session.order_ids:
                for line in order.lines:
                    id = line.product_id.id
                    if id not in products:
                        products[id] = {'product': line.product_id.name,
                                        'qty': 0,
                                        'total': 0}
                    products[id]['qty'] += line.qty
                    products[id]['total'] += line.price_subtotal_incl
        return products.values()

    def summary_by_tax(self, cr, uid, ids, context=None):
        assert len(ids) == 1, 'This option should only be used for a single id at a time.'
        account_tax_obj = self.pool.get('account.tax')
        res = {}  # tax_id -> data
        for session in self.browse(cr, uid, ids, context=context):
            for order in session.order_ids:
                for line in order.lines:
                    taxes_ids = [tax.id for tax in line.product_id.taxes_id if tax.company_id.id == line.order_id.company_id.id]

                    price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
                    cur = line.order_id.pricelist_id.currency_id
                    taxes = account_tax_obj.compute_all(cr, uid, taxes_ids, price, cur.id, line.qty, line.product_id.id, line.order_id.partner_id.id or False)

                    # print 'taxes', taxes
                    for tax in taxes['taxes']:
                        id = tax['id']
                        if id not in res:
                            t = account_tax_obj.browse(cr, uid, id, context=context)
                            tax_rule = ''
                            if t.amount_type == 'percent':
                                tax_rule = str(100 * t.amount) + '%'
                            else:
                                tax_rule = str(t.amount)
                            res[id] = {'name': tax['name'],
                                       'base': 0,
                                       'tax': tax_rule,
                                       'total': 0,
                                       }
                        # res[id]['base'] += cur.round(tax['price_unit'] * line.qty)
                        res[id]['base'] += cur.round(taxes['total_excluded'])
                        res[id]['total'] += tax['amount']
                        # cur_obj.round(cr, uid, cur, taxes['amount'])

        return res.values()

    def _calc_tax(self, cr, uid, ids, name, args, context=None):
        account_tax_obj = self.pool.get('account.tax')
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            res[session.id] = {'tax_base_total': 0}
            for order in session.order_ids:
                for line in order.lines:
                    taxes_ids = [tax for tax in line.product_id.taxes_id if tax.company_id.id == line.order_id.company_id.id]

                    price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
                    taxes = account_tax_obj.compute_all(cr, uid, taxes_ids, price, line.qty, product=line.product_id, partner_id=line.order_id.partner_id.id or False)

                    res[session.id]['tax_base_total'] += taxes['total']
        return res

    def _calc_sales(self, cr, uid, ids, name, args, context=None):
        res = {}
        for session in self.browse(cr, uid, ids, context=context):
            res[session.id] = {'untaxed_sales': 0}
            for order in session.order_ids:
                for line in order.lines:
                    if not line.product_id.taxes_id:
                        res[session.id]['untaxed_sales'] += line.price_subtotal
        return res

    _inherit = 'pos.session'

    cash_register_total_entry_encoding_custom = fields.Float(related='cash_register_id.total_entry_encoding_custom',
                                                                    string='Total Sales',
                                                                    readonly=True,
                                                                    )
    cash_register_total_entry_encoding_put_in = fields.Float(related='cash_register_id.total_entry_encoding_put_in',
                                                                    string='Cash put in',
                                                                    readonly=True,
                                                                    )
    cash_register_total_entry_encoding_take_out = fields.Float(related='cash_register_id.total_entry_encoding_take_out',
                                                                      string='Cash take out',
                                                                      readonly=True,
                                                                      ),
        #'validate':fields.Boolean(string="Validation",help="validation"),
        #'difference':fields.Function(_fun_difference,string="Difference"),
        #'difference2':fields.Float('difference2'),
        #'venta_bruta':fields.Function(_calc_vb,'Venta bruta', help='Gross sales'),
        #'isv':fields.Function(_calc_isv,'ISV'),
        #'subtotal':fields.Function(_calc_subtotal,'subtotal'),
        #'nro_facturas':fields.Char(compute="_calc_no_facturas",'nro facturas',),
        #'discount':fields.Function(_calc_discount,'discount'),
        #'tax_base_total':fields.Function(_calc_tax,'Total Sales without taxes',),
    untaxed_sales = fields.Float(compute=_calc_sales, string='Untaxed sales',)
        #'money_incoming':fields.Char(compute="_calc_money_incoming",'money incoming',),
        #'money_outgoing':fields.Char(compute="_calc_money_outgoing",'money outgoing',),
    statements_total = fields.Float(compute=_calc_statements_total, string='Total Payments Received')
    tickets_num = fields.Integer(compute="_calc_tickets", string='Number of Tickets',)
    ticket_first_id = fields.Many2one('pos.order', compute="_calc_tickets", string='First Ticket',)
    ticket_last_id = fields.Many2one('pos.order', compute="_calc_tickets", string='Last Ticket',)
        #'money_close':fields.Float('money Close'),
        #'money_reported':fields.Float('money Reported'),
