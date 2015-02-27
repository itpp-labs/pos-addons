# -*- coding: utf-8 -*-

from openerp.osv import fields, osv

class sessionpos(osv.Model):
	
	

	def _fun_diferencia(self,cr,uid,ids,fields,args,context=None):
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
			    self.write(cr,uid,session.id,{'diferencia2':total},context=context)
			    self.write(cr,uid,session.id,{'dn_cierre':totali},context=context)
			    self.write(cr,uid,session.id,{'dn_reportado':totalf},context=context)
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

	def _calc_descuento(self,cr,uid,ids,fields,args,context=None):
		res={}
		des_total=0
		for session in self.browse(cr,uid,ids,context=context):
		    for order in session.order_ids:
			descuento=0
			for desc in order.lines:
			    descuento+=desc.price_unit*(desc.discount/100)
			des_total+=descuento
		    res[session.id]=des_total	    				 
		return res


	def _calc_dn_entrante(self,cr,uid,ids,fields,args,context=None):
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

	def _calc_dn_saliente(self,cr,uid,ids,fields,args,context=None):
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
	   'validar':fields.boolean(string="Validacion",help="validacion"),
	   'diferencia':fields.function(_fun_diferencia,string="Diferencia"),
	   'diferencia2':fields.float('diferencia2'),
	   'venta_bruta':fields.function(_calc_vb,'venta bruta'),
	   'isv':fields.function(_calc_isv,'ISV'),
	   'subtotal':fields.function(_calc_subtotal,'subtotal'),
	   'nro_facturas':fields.function(_calc_no_facturas,'nro facturas',type="char"),
	   'descuento':fields.function(_calc_descuento,'descuento'),
	   'dinero_entrante':fields.function(_calc_dn_entrante,'dinero entrante',type="char"),
	   'dinero_saliente':fields.function(_calc_dn_saliente,'dinero saliente',type="char"),
	   'dn_cierre':fields.float('dinero Cierre'),
	   'dn_reportado':fields.float('dinero Cierre'),
}
	
