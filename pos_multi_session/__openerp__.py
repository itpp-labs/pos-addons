{
    'name': "Sync POS orders across multiple sessions",
    'version': '1.0.0',
    'author': 'Ivan Yelizariev',
    'category': 'Point Of Sale',
    'website': 'https://yelizariev.github.io',
    'depends': ['pos_disable_payment', 'bus'],
    'data': [
        'security/ir.model.access.csv',
        'views.xml',
        ],
    'installable': True,
}
