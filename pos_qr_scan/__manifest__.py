{
    "name": """QR Code Scanning in POS""",
    "summary": """Scans QR codes via device's camera""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/main.png"],
    "version": "12.0.1.0.1",
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
    ],
    "qweb": [
        "static/src/xml/templates.xml",
    ],

    "auto_install": False,
    "installable": True,
}
