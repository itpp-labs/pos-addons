# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Alipay Payments in POS""",
    "summary": """Support payment by scanning user's QR""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/pos_alipay.png"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "LGPL-3",
    "depends": [
        "alipay",
        "pos_qr_scan",
        "pos_qr_show",
        "pos_qr_payments",
        "pos_longpolling",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/assets.xml",
        "wizard/pos_payment_views.xml",
        "security/alipay_security.xml",
    ],
    "demo": [],
    "qweb": ["static/src/xml/pos.xml"],
    "auto_install": False,
    "installable": True,
}
