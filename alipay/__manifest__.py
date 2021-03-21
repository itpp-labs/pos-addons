# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Alipay API""",
    "summary": """Technical module to integrate odoo with Alipay""",
    "category": "Hidden",
    # "live_test_url": "",
    "images": ["images/alipay.png"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["product", "account", "qr_payments"],
    "external_dependencies": {"python": ["alipay"], "bin": []},
    "data": [
        "views/account_menuitem.xml",
        "views/alipay_order_views.xml",
        "views/alipay_refund_views.xml",
        "views/account_journal_views.xml",
        "data/ir_sequence_data.xml",
        "data/module_data.xml",
        "security/alipay_security.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [],
    "auto_install": False,
    "installable": True,
}
