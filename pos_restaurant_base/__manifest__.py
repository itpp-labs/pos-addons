{
    "name": """POS restaurant base""",
    "summary": """Technical module in POS""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": [],
    "version": "12.0.2.0.4",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_restaurant_base/",
    "license": "LGPL-3",
    "price": 35.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
