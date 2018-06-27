# Copyright 2018 {DEVELOPER_NAME} <https://it-projects.info/team/{DEVELOPER_GITHUB_USERNAME}>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Payments in POS via Wechat""",
    "summary": """WeChat payments in POS""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        "pos_qr_scan"
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/assets.xml",
    ],
    "qweb": [],

    "auto_install": False,
    "installable": False,
}


