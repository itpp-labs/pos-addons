# -*- coding: utf-8 -*-
{
    'name': "Disable payments in POS",
    'summary': "Control access to the POS payments",
    'version': '2.4.1',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category': 'Point Of Sale',
    "support": "apps@it-projects.info",
    'website': 'https://yelizariev.github.io',
    'depends': [
        'pos_discount'
    ],
    'images': ['images/pos_payment_access.png'],
    "price": 40.00,
    "currency": "EUR",
    'data': [
        'views.xml',
    ],
    'demo': [
        'views/assets_demo.xml',
    ],
    'installable': True,
}
