# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """QR Code Scanning in POS""",
    "summary": """Scans QR codes via device's camera""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/main.png"],
    "version": "12.0.2.0.0",
    "application": False,

    "author": "IT-Projects LLC, KolushovAlexandr",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_qr_scan/",
    "license": "LGPL-3",
    "price": 20.00,
    "currency": "EUR",

    "depends": [
        "pos_qr_payments",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/assets.xml",
        'views/pos_config.xml',
    ],
    "qweb": [
        "static/src/xml/templates.xml",
    ],

    "auto_install": False,
    "installable": True,
}
