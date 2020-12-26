# -*- coding: utf-8 -*-
{
    'name': 'Product lot in POS',
    'version': '1.0.1',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category': 'Point Of Sale',
    'website': 'https://twitter.com/yelizariev',
    'images': ['images/screenshot.png'],
    'depends': ['product_lot', 'pos_product_available'],
    'data': [
        'data.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'auto_install': True,
}
