# -*- coding: utf-8 -*-
{
    'name': "POS Chat",

    'summary': """Chat for employees""",

    'description': """
        POS Chat - module for chatting with colleges:
            - chat rooms
    """,

    'author': "Your Company",
    'website': "https://eda.yandex/restaurant/mcdonalds_ufa",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/openerp/addons/base/module/module_data.xml
    # for the full list
    'category': 'communication',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base'],

    # always loaded
    'data': [
        'view/chat_rooms.xml',
    ],
    'qweb': [
        'static/src/xml/chat.xml',
    ],
    # only loaded in demonstration mode
    # 'demo': [
    #     'demo.xml',
    # ],

    "application": False,
    "auto_install": False,
    "installable": True,
}
