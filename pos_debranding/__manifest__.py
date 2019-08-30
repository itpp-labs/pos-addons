{
    'name': "POS debranding",
    'version': '11.0.1.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category': 'Debranding',
    "support": "pos@it-projects.info",
    'website': 'https://twitter.com/yelizariev',
    'depends': ['point_of_sale'],
    # 'price': 30.00,
    # 'currency': 'EUR',
    'data': [
        'views.xml',
        'template.xml'
    ],
    'qweb': [
        'static/src/xml/pos_debranding.xml',
    ],
    'installable': True,
}
