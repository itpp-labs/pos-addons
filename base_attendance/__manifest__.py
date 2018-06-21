# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Partner Attendances""",
    "summary": """Manage partner attendances""",
    "category": "Extra Tools",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    "price": 60.00,
    "currency": "EUR",

    "depends": [
        'report',
        'barcodes'
    ],
    "external_dependencies": {"python": [], "bin": []},
    'data': [
        'security/res_attendance_security.xml',
        'security/ir.model.access.csv',
        'views/web_asset_backend_template.xml',
        'views/res_attendance_view.xml',
        'report/res_partner_badge.xml',
        'views/res_config_view.xml',
    ],
    'demo': [
    ],
    'qweb': [
        "static/src/xml/attendance.xml",
    ],
    'installable': True,
    'auto_install': False,
}
