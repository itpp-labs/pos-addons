# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """WeChat API""",
    "summary": """Technical module to intergrate odoo with WeChat""",
    "category": "Hidden",
    # "live_test_url": "",
    "images": [],
    "version": "11.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, KolushovAlexandr, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        'product',
        'account',
    ],
    "external_dependencies": {"python": [
        'wechatpy',
    ], "bin": []},
    "data": [
        "views/account_menuitem.xml",
        "views/wechat_micropay_views.xml",
        "views/wechat_order_views.xml",
        "views/wechat_refund_views.xml",
        "views/account_journal_views.xml",
        "data/ir_sequence_data.xml",
        "data/module_data.xml",
        "security/wechat_security.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [],

    "auto_install": False,
    "installable": True,
}
