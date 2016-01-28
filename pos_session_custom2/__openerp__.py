{
    'name' : 'Custom pos session report (2)',
    'version' : '1.0.0',
    'author' : 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category' : 'Custom',
    'website' : 'https://yelizariev.github.io',
    'description': """

Tested on Odoo 9.0
""",
    'data':[
        'views/session_view.xml',
        'views/pos_session_custom_report1.xml',
        'views/report1.xml',
        'views/layouts.xml',
    ],
    'depends': ['base','point_of_sale'],
    'init_xml': [],
    'update_xml': [],
    'installable': True,

}
