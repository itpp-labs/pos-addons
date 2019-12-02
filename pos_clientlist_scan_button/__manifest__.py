# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

{
    "name": """pos_clientlist_scan_button""",
    "summary": """Adds scan button for some fields on clientlist screen""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=12.0",
    "images": [],
    "version": "12.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_clientlist_scan_button/",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        'pos_qr_scan',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views/assets.xml',
    ],
    "demo": [
    ],
    "qweb": [
        'static/src/xml/clientlist.xml',
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,

    # "demo_title": "pos_clientlist_scan_button",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "Adds scan button for some fields on clientlist screen",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
