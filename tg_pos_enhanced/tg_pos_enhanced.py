# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2013 - Thierry Godin. All Rights Reserved
#    @author Thierry Godin <thierry@lapinmoutardepommedauphine.com>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

import logging
import time

from openerp import netsvc, tools, pooler
from openerp.osv import fields, osv
from openerp.tools.translate import _
from openerp import SUPERUSER_ID

import openerp.addons.decimal_precision as dp

_logger = logging.getLogger(__name__)


class pos_cashier(osv.Model):
    _name = 'pos.cashier'
    _order = 'cashier_name asc'

    _columns = {
        'pos_config_id' : fields.many2one('pos.config', 'Point Of Sale', required=True),
        'cashier_name': fields.char('Cashier', size=128, required=True),
        'active': fields.boolean('Active', help="If a cashier is not active, it will not be displayed in POS"),
    }

    _defaults = {
        'cashier_name' : '',
        'active' : True,
        'pos_config_id': lambda self,cr,uid,c: self.pool.get('res.users').browse(cr, uid, uid, c).pos_config.id,
    }

    _sql_constraints = [
        ('uniq_name', 'unique(cashier_name, pos_config_id)', "A cashier already exists with this name in this Point Of sale. Cashier's name must be unique!"),
    ]

class inherit_res_partners(osv.Model):
    _name='res.partner'   
    _inherit='res.partner'

    _columns={
        'montantCumule': fields.float('Cumulative', required=True),
        'pos_comment': fields.char('Comment in POS', size=50, help='Comment visible on POS receipt'),
    }
    
    _defaults={
        'montantCumule': 0,
    }

    # créer / modifier un client depuis le POS
    def write_partner_from_pos(self, cr, uid, cid, cname, cfirstname, czip, cphone, cmobile, cemail, ccomment, context=None):
        if context is None:
            context = {}
        name = cname.upper()
        firstname = cfirstname.capitalize()
        # mise a jour client

        client_id = int(cid)

        if client_id != 0:
        
            self.write(cr, uid, client_id, {
                    'name': name,
                    'firstname': firstname,
                    'zip': czip,
                    'phone': cphone,
                    'mobile': cmobile,
                    'email': cemail,
                    'pos_comment': ccomment,
                }, context=context)
            idClient = client_id
        
        # creation client
        else:

            idClient = self.create(cr, uid, {
                'name':name,
                'firstname':firstname,
                'zip':czip,
                'phone':cphone,
                'mobile':cmobile,
                'email':cemail,
                'pos_comment': ccomment,
                'company_id':False,
            }, context=context)
        
        return idClient   

inherit_res_partners()

class inherit_pos_order(osv.Model):
    _name = 'pos.order'
    _inherit = 'pos.order'

    def _amount_all_remise(self, cr, uid, ids, name, args, context=None):
        tax_obj = self.pool.get('account.tax')
        cur_obj = self.pool.get('res.currency')
        res = {}
        for order in self.browse(cr, uid, ids, context=context):
            res[order.id] = {
                'amount_paid': 0.0,
                'amount_return':0.0,
                'amount_tax':0.0,
            }
            val1 = val2 = 0.0
            cur = order.pricelist_id.currency_id
            discount = order.discount
            for line in order.lines:
                val1 += line.price_subtotal_incl
                val2 += line.price_subtotal
            res[order.id]['amount_tax'] = cur_obj.round(cr, uid, cur, val1-val2)
            res[order.id]['amount_total'] = cur_obj.round(cr, uid, cur, val1) - discount
            for payment in order.statement_ids:
                res[order.id]['amount_paid'] +=  payment.amount
                res[order.id]['amount_return'] += res[order.id]['amount_total'] - res[order.id]['amount_paid']
        return res

    _columns = {
        'cashier_name': fields.char('Cashier', size=128),
        'discount': fields.float('Remise'),
        'amount_total': fields.function(_amount_all_remise, string='Total', multi='all'),
        'amount_tax': fields.function(_amount_all_remise, string='Taxes', digits_compute=dp.get_precision('Point Of Sale'), multi='all'),
        'amount_paid': fields.function(_amount_all_remise, string='Paid', states={'draft': [('readonly', False)]}, readonly=True, digits_compute=dp.get_precision('Point Of Sale'), multi='all'),
        'amount_return': fields.function(_amount_all_remise, 'Returned', digits_compute=dp.get_precision('Point Of Sale'), multi='all'),
        'special_discount': fields.float('Special discount'),
        'special_discount_object': fields.char('Special discount object', size=128),
    }

    _defaults={
        'discount': 0,
        'special_discount': 0,
    }

    def create_from_ui(self, cr, uid, orders, context=None):
        order_ids = []
        for tmp_order in orders:
            order = tmp_order['data']
            order_id = self.create(cr, uid, {
                'name': order['name'],
                'user_id': order['user_id'] or False,
                'session_id': order['pos_session_id'],
                'lines': order['lines'],
                'pos_reference':order['name'],
                'partner_id': order['partner_id'] or False,
                'discount': order['discount'] or 0,
                'cashier_name': order['cashier_name'],
                'special_discount': order['special_discount'] or 0,
                'special_discount_object': order['special_disobj'] or False,
            }, context)

            for payments in order['statement_ids']:
                payment = payments[2]
                self.add_payment(cr, uid, order_id, {
                    'amount': payment['amount'] or 0.0,
                    'payment_date': payment['name'],
                    'statement_id': payment['statement_id'],
                    'payment_name': payment.get('note', False),
                    'journal': payment['journal_id']
                }, context=context)

            if order['amount_return']:
                session = self.pool.get('pos.session').browse(cr, uid, order['pos_session_id'], context=context)
                cash_journal = session.cash_journal_id
                cash_statement = False
                if not cash_journal:
                    cash_journal_ids = filter(lambda st: st.journal_id.type=='cash', session.statement_ids)
                    if not len(cash_journal_ids):
                        raise osv.except_osv( _('error!'),
                            _("No cash statement found for this session. Unable to record returned cash."))
                    cash_journal = cash_journal_ids[0].journal_id
                self.add_payment(cr, uid, order_id, {
                    'amount': -order['amount_return'],
                    'payment_date': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'payment_name': _('return'),
                    'journal': cash_journal.id,
                }, context=context)
            order_ids.append(order_id)
            
            wf_service = netsvc.LocalService("workflow")
            wf_service.trg_validate(uid, 'pos.order', order_id, 'paid', cr)

            partner_id = order['partner_id'] and int(order['partner_id']) or 0
            
            if partner_id != 0:
                amountPaid = order['amount_paid'] 
                obj_partner = self.pool.get('res.partner')
                cumulative = obj_partner.read(cr, uid, [partner_id], ['montantCumule'])
                amountCumulated = cumulative[0]['montantCumule']
                obj_partner.write(cr, uid, [partner_id], {'montantCumule': amountCumulated + amountPaid})

        return order_ids

    def get_infos_partner(self, cr, uid, partner, context=None):
        infos = pooler.get_pool(cr.dbname).get('res.partner').read(cr, uid, [partner], ['montantCumule', 'hasRemise'])
        infosPartner = []
        infosPartner.append(infos[0]['montantCumule'])
        return infosPartner
        
    def test_session(self, cr, uid, context=None):
        return True

    def create_picking(self, cr, uid, ids, context=None):
        """Create a picking for each order and validate it."""
        picking_obj = self.pool.get('stock.picking')
        partner_obj = self.pool.get('res.partner')
        move_obj = self.pool.get('stock.move')

        for order in self.browse(cr, uid, ids, context=context):
            if not order.state=='draft':
                continue
            addr = order.partner_id and partner_obj.address_get(cr, uid, [order.partner_id.id], ['delivery']) or {}
            picking_id = picking_obj.create(cr, uid, {
                'origin': order.name,
                'partner_id': addr.get('delivery',False),
                'type': 'out',
                'company_id': order.company_id.id,
                'move_type': 'direct',
                'note': order.note or "",
                'invoice_state': 'none',
                'auto_picking': True,
            }, context=context)
            self.write(cr, uid, [order.id], {'picking_id': picking_id}, context=context)
            location_id = order.warehouse_id.lot_stock_id.id
            output_id = order.warehouse_id.lot_output_id.id

            for line in order.lines:

                if line.product_id and line.product_id.type == 'service':
                    continue

                # line price < 0 = c'est un retour produit
                # on retourne le produit de sortie -> Stock
                if line.price_subtotal < 0:
                    location_id, output_id = output_id, location_id

                move_obj.create(cr, uid, {
                    'name': line.name,
                    'product_uom': line.product_id.uom_id.id,
                    'product_uos': line.product_id.uom_id.id,
                    'picking_id': picking_id,
                    'product_id': line.product_id.id,
                    'product_uos_qty': line.qty,
                    'product_qty': line.qty,
                    'tracking_id': False,
                    'state': 'draft',
                    'location_id': location_id,
                    'location_dest_id': output_id,
                }, context=context)
                
                if line.price_subtotal < 0:
                    location_id, output_id = output_id, location_id

            wf_service = netsvc.LocalService("workflow")
            wf_service.trg_validate(uid, 'stock.picking', picking_id, 'button_confirm', cr)
            picking_obj.force_assign(cr, uid, [picking_id], context)
        return True
        
    def get_partner_orders(self, cr, uid, partner_id, context=None):
        if context is None:
            context = {}

        result = []
        o_ids = self.search(cr, SUPERUSER_ID, [('partner_id', '=', int(partner_id))])

        if o_ids:

            for o_id in o_ids:
                order = self.browse(cr, SUPERUSER_ID, o_id)
                
                res_o = {
                    'id': o_id,
                    'pos_reference': order.pos_reference,
                    'date_order': order.date_order,
                    'name': order.name,
                    'state': order.state,
                    'cashier_name': order.cashier_name,
                    'discount': order.discount,
                    'amount_total': order.amount_total
                }
                
                result.append(res_o)
        return result

inherit_pos_order()

class inherit_res_users(osv.Model):
    _name='res.users'
    _inherit='res.users'

    _columns={
        'pos_manager_pwd': fields.char('POS Manager Password', size=64, help='Pasword is required for some actions to be made by manager in POS'),
    } 


class pos_config(osv.Model):
    _inherit = 'pos.config'
    _columns = {
        'iface_auto_print' : fields.boolean('Auto print', help="Auto print receipt")
        }
