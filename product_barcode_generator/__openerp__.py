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

{
    "name": 'Product barcode generator',
    "version": '1.0',
    "description": """
    This module will add a function which leads to an automatic generation of EAN13 for products
    
    You will have to define the company default value (6 firsts number of EAN13) then the 6 next number the sequence.
    The 13rd is the key of the EAN13, this will be automatically computed.
    """,
    "author": 'Julius Network Solutions',
    "website": 'http://www.julius.fr/',
    "depends": [
        'base',
        'product',
    ],
    "demo": [],
    "data": [
       "data/ean_sequence.xml",
       "res_company_view.xml",
       "product_view.xml",
       "sequence_view.xml",
    ],
    "installable": True,
    "active": False,
    "category" : "Stock Management",
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
