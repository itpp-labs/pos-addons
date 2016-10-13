# -*- encoding: utf-8 -*-
#
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2004-2008 Tiny SPRL (<http://tiny.be>). All Rights Reserved
#    Copyright (C) 2010-2013 Akretion (http://www.akretion.com)
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
{
    "name": "Product Variant Multi",
    "version": "1.0",
    "author": "OpenERP SA, Akretion",
    "category": "Sales Management",
    "license": "AGPL-3",
    "summary": "Products with multi-dimension variants",
    "description": """
Multi-axial varianted product support for OpenERP
=================================================

OpenERP is already supporting a product variants at the core level. But
without this module, variants are only mono-axial. OpenERP indeed uses the product.template
as the model object and the product.variant as the instance variant.
Using this module, you can now easily deal with multi-axial variants.

A product.template, now has a set of dimensions (like Color, Size, anything you want).
For each dimension, a product.template has a set of dimension values (like Red, Green
for the Color dimension). For each dimension, you can accept or not custom dimension
values. Dimensions can be shared between products.

Once the product.template is set up, you can use a 'generator' button that will populate
the space of the variants. You could also choose to populate only some combinations
by hand instead.

Each variant can have an extra price that will be taken into account when computing
the base listed price. Yet to be implemented: a price extra per variant dimension value.
Finally, this module is better used along with the product_variant_configurator which
will help the salesman selecting the appropriate variant in the sale order line
using dimension criteria instead of having to crawl the full space of variants.
The selection can also be done by name if a proper naming convention is adopted.

Gotchas:
Because many OpenERP reports refer only to the product name without taking care of the
variant, we decided it's better that each variant has a different name expliciting
the variant specifics. So we override the product.template#name field and make it
optional while product.product now has a new mandatory name field. This is usualy
transparent as OpenERP modules try to get their properties like name from product.product
and only from product.template if not found on product.product. But at least you
will have been warned.
    """,
    "depends": ["product", "point_of_sale"],
    "demo": ["demo_data.xml"],
    "data": [
        "security/ir.model.access.csv",
        "product_view.xml",
    ],
    "application": True,
    "active": False,
    'installable': False,
}
