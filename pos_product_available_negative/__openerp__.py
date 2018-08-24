# -*- coding: utf-8 -*-
{
    'name': 'Restrict out-of-stock POS Orders',
    'version': '1.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'summary': 'Only supervisor can approve POS Order with out-of-stock product',
    'license': 'LGPL-3',
    'category': 'Point Of Sale',
    'website': 'https://it-projects.info',
    'depends': [
        'pos_pin',
        'pos_product_available',
    ],
    'data': [
        'data.xml',
        'views.xml',
    ],

    "price": 50.00,
    "currency": "EUR",

    'installable': True,
}
