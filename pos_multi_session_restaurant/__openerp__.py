# -*- coding: utf-8 -*-
{
    'name': "Sync restaurant orders",
    'summary': 'Staff get order details immediately after waiter taps on tablet',
    'version': '1.1.4',
    'author': 'Ivan Yelizariev',
    'category': 'Point Of Sale',
    'website': 'https://yelizariev.github.io',
    'price': 140.00,
    'currency': 'EUR',
    'depends': ['pos_restaurant', 'pos_multi_session', 'to_pos_shared_floor'],
    'data': [
        'views.xml',
    ],
    'demo': [
        'demo/demo.xml',
    ],
    'installable': True,
    'auto_install': True,
}
