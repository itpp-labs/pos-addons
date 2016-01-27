# -*- coding: utf-8 -*-
#################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2013 Julius Network Solutions SARL <contact@julius.fr>
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
#################################################################################

from openerp.osv import fields, orm
from openerp.tools.translate import _

def isodd(x):
    return bool(x % 2)

#class product_template(orm.Model):
#    _inherit = 'product.template'
#
#    _columns = {
#        'variants': fields.one2many('product.product', 'product_tmpl_id', 'Variants'),
#    }
#    
#    def generate_ean13(self, cr, uid, ids, context=None):
#        if context is None: context = {}
#        product_obj = self.pool.get('product.product')
#        templates = self.browse(cr, uid, ids, context=context)
#        for template in templates:
#            variant_ids = [x.id for x in template.variant_ids]
#            product_obj.generate_ean13(cr, uid, variant_ids, context=context)
#        return True

class product_category(orm.Model):
    _inherit = 'product.category'
    
    _columns = {
        'ean_sequence_id': fields.many2one('ir.sequence', 'Ean Sequence'),
    }
    
class product_product(orm.Model):
    _inherit = 'product.product'
    
    _columns = {
        'ean_sequence_id': fields.many2one('ir.sequence', 'Ean Sequence'),
    }
    
    def _get_ean_next_code(self, cr, uid, product, context=None):
        if context is None: context = {}
        sequence_obj = self.pool.get('ir.sequence')
        ean = ''
        if product.ean_sequence_id:
            ean = sequence_obj.next_by_id(cr, uid, product.ean_sequence_id.id, context=context)
        elif product.categ_id.ean_sequence_id:
            ean = sequence_obj.next_by_id(cr, uid, product.categ_id.ean_sequence_id.id, context=context)
        elif product.company_id and product.company_id.ean_sequence_id:
            ean = sequence_obj.next_by_id(cr, uid, product.company_id.ean_sequence_id.id, context=context)
        elif context.get('sequence_id'):
            ean = sequence_obj.next_by_id(cr, uid, context.get('sequence_id'), context=context)
        else:
            return None
        if len(ean) > 12:
            raise orm.except_orm(_("Configuration Error!"),
                 _("There next sequence is upper than 12 characters. This can't work."
                   "You will have to redefine the sequence or create a new one"))
        else:
            ean = (len(ean[0:6]) == 6 and ean[0:6] or ean[0:6].ljust(6,'0')) + ean[6:].rjust(6,'0')
        return ean
    
    def _get_ean_key(self, code):
        sum = 0
        for i in range(12):
            if isodd(i):
                sum += 3 * int(code[i])
            else:
                sum += int(code[i])
        key = (10 - sum % 10) % 10
        return str(key)
    
    def _generate_ean13_value(self, cr, uid, product, context=None):
        ean13 = False
        if context is None: context = {}
        ean = self._get_ean_next_code(cr, uid, product, context=context)
        if not ean:
            return None
        key = self._get_ean_key(ean)
        ean13 = ean + key
        return ean13
    
    def generate_ean13(self, cr, uid, ids, context=None):
        if context is None: context = {}
        product_ids = self.browse(cr, uid, ids, context=context)
        for product in product_ids:
            if product.ean13:
                continue
            ean13 = self._generate_ean13_value(cr, uid, product, context=context)
            if not ean13:
                continue
            self.write(cr, uid, [product.id], {
                        'ean13': ean13
                    }, context=context)
        return True
    
    def copy(self, cr, uid, id, default=None, context=None):
        if default is None: default = {}
        if context is None: context = {}
        default['ean13'] = False
        return super(product_product, self).copy(cr, uid, id, default=default, context=context)

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
