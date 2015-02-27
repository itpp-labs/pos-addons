# -*- coding: utf-8 -*-

from openerp.osv import fields, osv

class sessionpos(osv.Model):

    def _fun_difference(self,cr,uid,ids,fields,args,context=None):
        res={}
        total=0
        totali=0
        for session in self.browse(cr,uid,ids,context=context):
            totali=session.cash_register_balance_end
            totalf=session.cash_register_balance_end_real
            for order in session.order_ids:
                flag=False
                for producto in order.lines:
                    if producto.product_id.expense_pdt:
                        print producto.product_id.name
                        flag=True
                if flag==True:
                    totali-=(order.amount_total*2)

            total= (totali - totalf)
            res[session.id]=total

            if total<0:
                total=-total
            else:
                total=-total

            if session.state!='closed':
                self.write(cr,uid,session.id,{'difference2':total},context=context)
                self.write(cr,uid,session.id,{'money_close':totali},context=context)
                self.write(cr,uid,session.id,{'money_reported':totalf},context=context)
        return res

    def _calc_vb(self,cr,uid,ids,fields,args,context=None):
        res={}
        total=0
        flag=False
        for session in self.browse(cr,uid,ids,context=context):
            for order in session.order_ids:
                flag=False
                for producto in order.lines:
                    if producto.product_id.expense_pdt or producto.product_id.income_pdt:
                        flag=True
                if flag==False:
                    total+=order.amount_total
            res[session.id]=total
        return res

    def _calc_isv(self,cr,uid,ids,fields,args,context=None):
        res={}
        total=0
        for session in self.browse(cr,uid,ids,context=context):
            for order in session.order_ids:
                total+=order.amount_tax
            res[session.id]=total
        return res

    def _calc_subtotal(self,cr,uid,ids,fields,args,context=None):
        res={}
        total=0
        for session in self.browse(cr,uid,ids,context=context):
            total=session.venta_bruta-session.isv
            res[session.id]=total
        return res

    def _calc_no_facturas(self,cr,uid,ids,fields,args,context=None):
        res={}
        array=[]
        count=0
        for session in self.browse(cr,uid,ids,context=context):
            for order in session.order_ids:
                count+=1
                array.append(order.pos_reference)
            if array:
                res[session.id]=str(count) + " facturas "+str(array[len(array)-1])+" A "+str(array[0])

        return res

    def _calc_discount(self,cr,uid,ids,fields,args,context=None):
        res={}
        for session in self.browse(cr,uid,ids,context=context):
            des_total=0
            for order in session.order_ids:
                discount=0
                for desc in order.lines:
                    discount+=desc.price_unit*(desc.discount/100)
                des_total+=discount
            res[session.id]=des_total
        return res

    def _calc_money_incoming(self,cr,uid,ids,fields,args,context=None):
        res={}
        total=0
        counttotal=0
        for session in self.browse(cr,uid,ids,context=context):
            for order in session.order_ids:
                total2=0
                count=0
                for desc in order.lines:
                    if desc.product_id.income_pdt:
                        count+=1
                        total2+=desc.price_subtotal_incl
                total+=total2
                counttotal+=count
            res[session.id]=str(counttotal) + " Entrada(s) "+" Total Entradas "+ str(total)
        return res

    def _calc_money_outgoing(self,cr,uid,ids,fields,args,context=None):
        res={}
        total=0
        counttotal=0
        for session in self.browse(cr,uid,ids,context=context):
            for order in session.order_ids:
                total2=0
                count=0
                for desc in order.lines:
                    if desc.product_id.expense_pdt:
                        count+=1
                        total2+=desc.price_subtotal_incl
                total+=total2
                counttotal+=count
            res[session.id]=str(counttotal) + " Salida(s) "+"  Total Salidas "+ str(total)
        return res

    _inherit = 'pos.session'
    _columns = {
        'validate':fields.boolean(string="Validation",help="validation"),
        'difference':fields.function(_fun_difference,string="Difference"),
        'difference2':fields.float('difference2'),
        'venta_bruta':fields.function(_calc_vb,'Venta bruta', help='Gross sales'),
        'isv':fields.function(_calc_isv,'ISV'),
        'subtotal':fields.function(_calc_subtotal,'subtotal'),
        'nro_facturas':fields.function(_calc_no_facturas,'nro facturas',type="char"),
        'discount':fields.function(_calc_discount,'discount'),
        'money_incoming':fields.function(_calc_money_incoming,'money incoming',type="char"),
        'money_outgoing':fields.function(_calc_money_outgoing,'money outgoing',type="char"),
        'money_close':fields.float('money Close'),
        'money_reported':fields.float('money Reported'),
    }
