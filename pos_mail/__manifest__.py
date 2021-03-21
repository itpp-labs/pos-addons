# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
{
    "name": """POS Receipts by mail""",
    "summary": """Module allows to send POS receipts to partners by mail""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=12.0",
    "images": ["images/pos_mail.jpg"],
    "version": "12.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    # "price": 9.00,
    # "currency": "EUR",
    "depends": ["point_of_sale", "mail"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["data/mail_body_template.xml", "views/assets.xml", "views/views.xml"],
    "demo": ["demo/demo.xml"],
    "qweb": ["static/src/xml/templates.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    # "demo_title": "POS Receipts by mail",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "Module allows to send POS receipts to partners",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
