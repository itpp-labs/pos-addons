# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Postponed Invoices in POS""",
    "summary": """This module allows the usage of a regular POS order payment process to create an invoice to be paid later""",
    "category": "Point of Sale",
    "images": ["images/postponed2.jpg"],
    "version": "12.0.1.0.1",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "help@itpp.dev",
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
    "installable": True,
}
