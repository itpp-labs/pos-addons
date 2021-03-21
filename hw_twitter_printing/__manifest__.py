# -*- coding: utf-8 -*-
{
    "name": """Print tweets with PosBox""",
    "summary": """Print tweets with specific hashtags""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": [],
    "external_dependencies": {"python": ["twython", "escpos"], "bin": []},
    "data": [],
    "qweb": [],
    "demo": [],
    "post_load": "post_load",
    "pre_init_hook": None,
    "post_init_hook": "post_init",
    "auto_install": False,
    "installable": True,
}
