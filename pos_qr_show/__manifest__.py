# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS QR Showing in POS""",
    "summary": """Show QR for qr-based payment systems in POS or Customer Screen""",
    "category": "Hidden",
    "images": [],
    "version": "13.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "help@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/assets.xml"],
    "demo": [],
    "qweb": ["static/src/xml/pos.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": False,
}
