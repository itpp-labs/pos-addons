{
    "name": """POS Sale Coupon""",
    "summary": """Allows to use discount sale coupons in POS orders""",
    "category": "Point of Sale",
    "images": [],
    "version": "12.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_sale_coupons/",
    "license": "LGPL-3",
    # "price": 0.00,
    # "currency": "EUR",

    "depends": [
        "sale_coupon",
        "pos_longpolling",
        "base_automation",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_sale_coupons_template.xml",
        "views/sale_coupon_program_view.xml",
        "views/pos_config_view.xml",
        "views/pos_order_view.xml",
        "actions/base_action_rules.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
