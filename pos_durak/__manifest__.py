# -*- coding: utf-8 -*-
{
    'name': "POS Durak",

    'summary': """Cards game for employees""",

    'description': """
        POS Durak - module allow's to play "Durak" card game with colleges
    """,

    'author': "IT-Projects LLC",
    'website': "https://www.gambler.ru/Durak_rules",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/openerp/addons/base/module/module_data.xml
    # for the full list
    'category': 'communication',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['point_of_sale', 'pos_longpolling'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'view/durak_view.xml',
    ],
    'qweb': [
        'static/src/xml/durak.xml',
    ],
    # only loaded in demonstration mode
    # 'demo': [
    #     'demo.xml',
    # ],

    "application": False,
    "auto_install": False,
    "installable": True,
}
