# -*- coding: utf-8 -*-
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

{
    "name": """Sync Server for POS orders""",
    "summary": """Sync orders via main or separate (e.g. local) server""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": ["images/pos_multi_session_sync.jpg"],
    "version": "10.0.1.0.7",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "Other OSI approved licence",  # MIT
    "price": 60.00,
    "currency": "EUR",
    "depends": ["pos_longpolling"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["security/ir.model.access.csv"],
    "qweb": [],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
