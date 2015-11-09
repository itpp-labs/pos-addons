{
    'name': "Sync POS orders across multiple sessions",
    'version': '1.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category': 'Point Of Sale',
    'website': 'https://yelizariev.github.io',
    'depends': ['pos_disable_payment', 'bus'],
    'data': [
        'security/ir.model.access.csv',
        'views.xml',
        ],
    'qweb': [
        'static/src/xml/pos_multi_session.xml',
    ],
    'installable': True,
}
