# -*- coding: utf-8 -*-
# Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017-2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# Copyright 2017 gaelTorrecillas <https://github.com/gaelTorrecillas>
# Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Saving removed products of POS order""",
    "summary": """Store all cases of product removing and allow to specify reasons for it""",
    "category": "Point of Sale",
    "images": ["images/pos_order_cancel.png"],
    "version": "10.0.1.3.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "Other OSI approved licence",  # MIT
    "price": 200.00,
    "currency": "EUR",
    "depends": ["point_of_sale", "pos_pin"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/security.xml",
        "security/ir.model.access.csv",
        "views/template.xml",
        "views/views.xml",
        "views/pos_config_view.xml",
    ],
    "qweb": ["static/src/xml/cancel_order.xml"],
    "demo": ["data/pos_cancelled_reason_demo.xml", "views/assets_demo.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
