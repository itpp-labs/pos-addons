{
    "name": """POS WeChat Pay""",
    "summary": """Payments in POS via WeChat""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, KolushovAlexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        "point_of_sale", "pos_qr_scan",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/assets.xml",
        "views/views.xml",
    ],
    "qweb": [],

    "auto_install": False,
    "installable": True,
}
