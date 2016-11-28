# -*- coding: utf-8 -*-
#
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
#

from openerp import fields
import logging

_logger = logging.getLogger(__name__)


class ProductPack(orm.Model):
    _name = "product.pack"
    _description = "Product packs"

    _order = 'group_id, sequence'

    product_id = fields.Many2one('product.product', 'Product', required=True)
    item_tmpl_id = fields.Many2one('product.template', 'Item', required=True)
    group_id = fields.Integer('Group number', help='Set a number to group items')
    quantity = fields.Float('Quantity')
    sequence = fields.Integer('Sequence')

    _defaults = {
        'quantity': 1,
        'sequence': 1,
        'group_id': 1,
    }


class InheritProduct(orm.Model):
    _name = "product.product"
    _inherit = "product.product"


    is_pack = fields.Boolean('Custom Pack')
    pack_ids = fields.One2many('product.pack', 'product_id', 'Items in the pack')

    _defaults = {
        'is_pack': False,
    }

    def onchange_ispack(self, cr, uid, ids, value, context=None):
        if context is None:
            context = {}

        if value:
            product_obj = self.pool.get('product.product')
            products = product_obj.browse(cr, uid, ids)

            pos_cat_obj = self.pool.get('pos.category')
            pos_cat_id = pos_cat_obj.search(cr, uid, [('name', '=', 'Custom Packs'), ('is_pack', '=', True)], context=context)

            if pos_cat_id:
                cat_id = pos_cat_id[0]
            else:
                cat_id = None

            if products:
                tmpl_id = products[0].product_tmpl_id.id
                if tmpl_id:
                    tmpl_obj = self.pool.get('product.template')
                    tmpl_obj.write(cr, uid, tmpl_id, {'type': 'service'}, context=context)

            return {'value': {'type': 'service', 'pos_cat_id': cat_id}}
        else:
            return {'value': {'type': None}}
        return {}

    def create(self, cr, uid, vals, context=None):
        if context is None:
            context = {}

        res = super(InheritProduct, self).create(cr, uid, vals, context=context)

        product_obj = self.pool.get('product.product')
        product = product_obj.browse(cr, uid, res)

        if product:
            tmpl_id = product.product_tmpl_id.id
            tmpl_name = product.name_template
            prod_name = product.name

            _logger.info(tmpl_id)

            if tmpl_name != prod_name:
                tmpl_obj = self.pool.get('product.template')
                tmpl_obj.write(cr, uid, tmpl_id, {'name': prod_name}, context=context)

        return res


class InheritProductCategory(orm.Model):
    _name = "product.category"
    _inherit = "product.category"


    is_pack = fields.Boolean('Custom Pack Category')

    _defaults = {
        'is_pack': False,
    }

    def init(self, cr):
        # For the first installation we create a new category for Custom Packs
        pack_ids = self.search(cr, 1, [('name', '=', 'Custom Packs'), ('is_pack', '=', True)], context=None)
        if not pack_ids:
            self.create(cr, 1, {'name': 'Custom Packs', 'parent_id': 2, 'is_pack': True})
        return True


class InheritProductPublicCategory(orm.Model):
    _inherit = "pos.category"


    is_pack = fields.Boolean('Custom Pack Category')

    _defaults = {
        'is_pack': False,
    }

    def init(self, cr):
        # For the first installation we create a new category for Custom Packs
        pack_ids = self.search(cr, 1, [('name', '=', 'Custom Packs'), ('is_pack', '=', True)], context=None)
        if not pack_ids:
            self.create(cr, 1, {'name': 'Custom Packs', 'is_pack': True})
        return True

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
