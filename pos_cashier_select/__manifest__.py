# Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# Copyright 2018 Ruslan Ronzhin <https://it-projects.info/team/rusllan/>
# Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73/>
# Copyright 2020 Almas Giniatullin <https://it-projects.info/team/almas50>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS Cashier Select""",
    "summary": """Forced choose a cashier before switching to payment screen""",
    "category": "Point of Sale",
    "images": ["images/pos_cashier_select.png"],
    "version": "14.0.1.0.2",
    "application": False,
    "author": "IT-Projects LLC, Artyom Losev",
    "support": "apps@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons",
    "license": "Other OSI approved licence",  # MIT
    "price": 20.00,
    "currency": "EUR",
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/views.xml"],
    "qweb": ["static/src/xml/pos.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
