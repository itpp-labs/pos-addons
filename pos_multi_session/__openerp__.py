{
    'name': "Sync POS orders across multiple sessions",
    'version': '1.0.0',
    'summary': """Use multiple POS for handling orders""",
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category': 'Point Of Sale',
    'images': ['images/pos-multi-session.png'],
    'website': 'https://yelizariev.github.io',
    'price': 30.00,
    'currency': 'EUR',
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
