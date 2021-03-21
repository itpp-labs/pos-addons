# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Postponed Invoices in POS""",
    "summary": """This module allows the usage of a regular POS order payment process to create an invoice to be paid later""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=13.0",
    "images": ["images/postponed2.jpg"],
    "version": "13.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/views.xml", "views/assets.xml"],
    "demo": [],
    "qweb": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": False,
    # "demo_title": "Creation of Postponed invoices in POS",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "This module allows the usage of a regular POS order payment process to create an invoice to be paid later",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
