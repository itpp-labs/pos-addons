# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Sync Partners in POS""",
    "summary": """Instant updates of the partner data in POS""",
    "category": "Point of Sale",
    "images": ["images/pos_partner_sync.jpeg"],
    "version": "13.0.2.0.1",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "help@itpp.dev",
    "website": "https://twitter.com/OdooFree",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["point_of_sale", "pos_longpolling"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/assets.xml", "views/pos_config.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
}
