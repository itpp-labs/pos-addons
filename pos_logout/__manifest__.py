# Copyright 2017 Artyom Losev <https://github.com/ArtyomLosev>
# Copyright 2017-2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2020 Almas Giniatullin <https://it-projects.info/team/almas50>
# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Lock POS Screen""",
    "summary": """Automatically lock pos on inactivity""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/pos-logout?version=13.0",
    "images": ["images/pos_logout_main.png"],
    "version": "13.0.2.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "price": 20.00,
    "currency": "EUR",
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/pos_logout.xml"],
    "qweb": ["static/src/xml/pos.xml"],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
