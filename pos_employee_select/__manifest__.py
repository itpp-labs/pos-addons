{
    "name": """POS Employee Select""",
    "summary": """Forced choose a cashier and a salesperson before switching to payment screen""",
    "category": "Point of Sale",
    # "images": ['images/pos_cashier_select.png'],
    "version": "12.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_emplotee_select/",
    "license": "LGPL-3",
    # "price": 39.00,
    # "currency": "EUR",

    "depends": [
        "pos_cashier_select",
        "hr",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/views.xml",
        "views/template.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
