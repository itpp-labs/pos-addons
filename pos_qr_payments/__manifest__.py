# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """QR-based payments in POS""",
    "summary": """Technical module to support qr-based payments like Alipay, WeChat""",
    "category": "Hidden",
    "images": [],
    "version": "13.0.1.0.1",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "help@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["wizard/pos_payment_views.xml", "views/assets.xml"],
    "demo": [],
    "qweb": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": False,
}
