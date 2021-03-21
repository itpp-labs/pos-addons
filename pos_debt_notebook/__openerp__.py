# -*- coding: utf-8 -*-
{
    'name': 'Debt notebook for POS',
    'version': '8.0.3.0.1',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'summary': 'Comfortable sales for your regular customers. Debt payment method for POS',
    'license': 'GPL-3',
    'category': 'Point Of Sale',
    'website': 'https://github.com/itpp-labs/pos-addons#readme',
    'depends': ['point_of_sale'],
    'images': [
        'images/screenshot-2.png',
        'images/screenshot-3.png',
        'images/screenshot-1.png',
    ],
    'data': [
        'data/product.xml',
        'views.xml',
        'data.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'uninstall_hook': 'pre_uninstall',
}
