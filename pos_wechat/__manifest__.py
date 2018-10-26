# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """WeChat Payments in POS""",
    "summary": """Support WeChat QR-based payments (scan and show)""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/main.jpg"],
    "version": "11.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/yelizariev",
    "license": "LGPL-3",
    "price": 330.00,
    "currency": "EUR",

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
        "wizard/pos_payment_views.xml",
    ],
    "demo": [
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],

    "auto_install": False,
    "installable": True,
}
