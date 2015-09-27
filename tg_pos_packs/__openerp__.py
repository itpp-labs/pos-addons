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


{
    'name': 'TG customizable product packs',
    'version': '1.0',
    'category': 'Point of sale',
    'author': 'Thierry Godin, IT-Projects LLC, Ivan Yelizariev',
    'website': 'https://yelizariev.github.io/',
    'summary': 'Create on demand packs of products for Point of sale',
    'description': """
Allows the creation of products as Packs that can contain products with variants.
=====================================================================================

Building a Pack :
-------------------

- Create a product as usual (via Product Variants Menu) and name it, say Pack1
- Check Custom Pack checkbox
- Type of product should be set to Service automatically
- Go on Pack tab
- Add templates products grouped by index :  each group of templates will be displayed in a list in POS
- That's all

Packs are avaiable in POS :
---------------------------

Packs are avaiable in POS as usual products (visualy).

When you select a pack, a new screen is displayed and you can select one template for each group, the select the needed variant you set previously.

Pack is added to caddie as well as its products, but thoses products prices are set to 0.00 as well as on receipt.

This way, you can set a reduced price for the pack , even if the sumn of each products may be superior. (This is for what packs are made), 
but also, you can build your pack on-demand, by making groups of templates .

Tested on odoo 8.0 33a8989d77f44b093214550b8f23cb386a990981
    """,
    'depends': [
        'product', 'point_of_sale'
    ],
    'data': [
        'pos_product_pack_view.xml',
        'security/ir.model.access.csv',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'active': False,
    'auto_install': False,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
