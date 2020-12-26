# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """WeChat mini-program API""",
    "summary": """Technical module to intergrate odoo with WeChat mini-program""",
    "category": "Hidden",
    # "live_test_url": "",
    "images": ["images/wechat_miniprogram.jpg"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["wechat"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "data/module_data.xml",
        "security/wechat_security.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [],
    "auto_install": False,
    "installable": True,
}
