# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
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
        "views/wechat_micropay_views.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [],

    "auto_install": False,
    "installable": True,
}
