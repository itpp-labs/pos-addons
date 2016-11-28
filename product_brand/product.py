# -*- coding: utf-8 -*-
#
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2004-2010 Tiny SPRL (<http://tiny.be>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
#


from openerp import models, fields



class ProductTemplate(models.Model):
    _inherit = "product.template"

    branch_id = fields.Many2one('product.branch', 'Product Branch')


class ProductBranch(models.Model):
    _name = 'product.branch'

    name = fields.Char('Brand Name', size=250),
    description = fields.Text('Description'),
    product_ids = fields.One2many('product.template', 'branch_id', 'Products'),



# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
