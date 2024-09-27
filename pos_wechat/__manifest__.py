# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """WeChat Payments in POS""",
    "summary": """Support WeChat QR-based payments (scan and show)""",
    "category": "Point of Sale",
    "images": ["images/main.jpg"],
    "version": "14.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "help@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": [
        "wechat",
        "pos_qr_scan",
        "pos_qr_show",
        "pos_qr_payments",
        "pos_longpolling",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/assets.xml",
        "views/pos_payment_method_views.xml",
        "wizard/pos_payment_views.xml",
    ],
    "demo": [],
    "qweb": ["static/src/xml/pos.xml"],
    "auto_install": False,
    "installable": True,
}
