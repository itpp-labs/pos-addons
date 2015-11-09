{
    'name': "POS debranding",
    'version': '1.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category': 'Debranding',
    'website': 'https://yelizariev.github.io',
    'depends': ['point_of_sale'],
    'price': 30.00,
    'currency': 'EUR',
    'data': [
        'views.xml',
        ],
    'qweb': [
        'static/src/xml/pos_debranding.xml',
    ],
    'installable': True,
}
