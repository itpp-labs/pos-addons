# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """WeChat API""",
    "summary": """Technical module to integrate Odoo with WeChat""",
    "category": "Hidden",
    # "live_test_url": "",
    "images": [],
    "version": "11.0.1.0.1",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/yelizariev",
    "license": "Other OSI approved licence",  # MIT
    "price": 150.00,
    "currency": "EUR",
    "depends": ["product", "account", "qr_payments"],
    "external_dependencies": {"python": ["wechatpy"], "bin": []},
    "data": [
        "views/account_menuitem.xml",
        "views/wechat_micropay_views.xml",
        "views/wechat_order_views.xml",
        "views/wechat_refund_views.xml",
        "views/account_journal_views.xml",
        "data/ir_sequence_data.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [],
    "auto_install": False,
    "installable": True,
}
