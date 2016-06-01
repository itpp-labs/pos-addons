# -*- coding: utf-8 -*-
{
    'name': 'Debt notebook (technical core)',
    'summary': 'Debt payment method for POS',
    'category': 'Point Of Sale',
    "images": [],
    'version': '2.0.0',

    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'website': 'https://it-projects.info',
    'license': 'LGPL-3',
    # "price": 20.00,
    # "currency": "EUR",

    "external_dependencies": {"python": [], "bin": []},
    'depends': ['point_of_sale', 'account'],
    'data': [
        'data.xml',
        'views.xml',
    ],
    "demo": [
    ],
    'installable': True,
    "auto_install": False,
}
