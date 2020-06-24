# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Tencent Cloud SMS API""",
    "summary": """Technical module to intergrate odoo with Tencent Cloud SMS""",
    "category": "Hidden",
    # "live_test_url": "",
    "images": ["images/qcloud_sms1.jpg"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "Other OSI approved licence",  # MIT
    # "price": 9.00,
    # "currency": "EUR",
    "depends": ["base"],
    "external_dependencies": {"python": ["qcloudsms_py", "phonenumbers"], "bin": []},
    "data": ["security/ir.model.access.csv", "views/res_config.xml"],
    "qweb": [],
    "auto_install": False,
    "installable": True,
}
