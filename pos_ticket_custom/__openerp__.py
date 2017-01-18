# -*- coding: utf-8 -*-
{
    'name': 'Custom pos ticket ',
    'version': '1.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category': 'Point Of Sale',
    "support": "apps@it-projects.info",
    'website': 'https://yelizariev.github.io',
    'description': """
    module *ir_sequence_autoreset* is available here: https://github.com/yelizariev/addons-yelizariev
    """,
    'depends': ['point_of_sale', 'ir_sequence_autoreset'],
    'data': [
        'data.xml',
        'views.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': False,
    'auto_install': False,
}
