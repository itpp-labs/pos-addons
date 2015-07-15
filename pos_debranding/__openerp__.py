{
    'name': "POS debranding",
    'version': '1.0.0',
    'author': 'Ivan Yelizariev',
    'category': 'Debranding',
    'website': 'https://yelizariev.github.io',
    'depends': ['point_of_sale'],
    'data': [
        'views.xml',
        ],
    'qweb': [
        'static/src/xml/pos_debranding.xml',
    ],
    'installable': True,
}
