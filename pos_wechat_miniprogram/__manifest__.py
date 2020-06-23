# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS: WeChat Mini-program""",
    "summary": """Integrate POS with WeChat mini-program""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/pos_wechat_miniprogram.jpg"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "Other OSI approved licence",  # MIT
    # "price": 9.00,
    # "currency": "EUR",
    "depends": ["wechat_miniprogram", "pos_wechat"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["security/wechat_security.xml", "security/ir.model.access.csv"],
    "demo": [],
    "qweb": [],
    "auto_install": False,
    "installable": True,
}
