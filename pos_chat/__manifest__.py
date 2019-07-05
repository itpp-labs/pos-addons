# -*- coding: utf-8 -*-
{
    'version': "0.1",
    'name': "Pos chat",
    'summary': "Task 4",
    'category': "Point of Sale",
    # 'live_test_url': "",
    'images': [],
    'application': False,

    'author': "XOE",
    'website': "https://xoe.solutions",
    'license': "LGPL-3",
    # 'price: 250.00,
    # 'currency: "EUR",g

    'depends': [],
    'external_dependencies': {"python": [], "bin": []},

    'data': [
        # 'security/ir.model.access.csv',
        'data/data.xml',
        'views/views.xml',
        'views/templates.xml',
    ],
    'qweb': [
        # 'static/src/xml/*.xml',
    ],
    'demo': [
        'demo/demo.xml'
    ],

    'post_load': None,
    'pre_init_hook': None,
    'post_init_hook': None,
    'uninstall_hook': None,

    'auto_install': False,
    'installable': True,

    'description': """
None
"""
}
