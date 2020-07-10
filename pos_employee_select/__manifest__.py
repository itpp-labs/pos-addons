# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS Employee Select""",
    "summary": """Forced choose a cashier and a salesperson before switching to payment screen""",
    "category": "Point of Sale",
    # "images": ['images/pos_cashier_select.png'],
    "version": "12.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@itpp.dev",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_emplotee_select/",
    "license": "Other OSI approved licence",  # MIT
    # "price": 39.00,
    # "currency": "EUR",
    "depends": ["pos_cashier_select", "hr"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/views.xml", "views/template.xml"],
    "qweb": ["static/src/xml/pos.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
