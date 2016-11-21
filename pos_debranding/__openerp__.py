# -*- coding: utf-8 -*-
{
    'name': "POS debranding",
    'version': '1.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category': 'Debranding',
    'website': 'https://twitter.com/yelizariev',
    'depends': ['point_of_sale'],
    # 'price': 30.00,
    # 'currency': 'EUR',
    'data': [
        'views.xml',
    ],
    'qweb': [
        'static/src/xml/pos_debranding.xml',
    ],
    'installable': True,
}
