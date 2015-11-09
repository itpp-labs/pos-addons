# -*- coding: utf-8 -*-
{
    'name' : 'Custom pos session report',
    'version' : '1.0.0',
    'author' : 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category' : 'Custom',
    'website' : 'https://yelizariev.github.io',
    'description': """

Tested on Odoo 8.0 eed09ba4105ae8f47a37c5071217cea2ef2e153e
""",
    'data':[
        'views/session_view.xml',
        'views/pos_session_custom_report1.xml',
        'views/report1.xml',
        'views/layouts.xml',
    ],
    'depends': ['base','point_of_sale'],
    'init_xml': [],
    'update_xml': [],
    'installable': True,

}
