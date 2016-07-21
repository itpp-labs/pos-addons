{
    'name': 'Debt notebook for POS',
    'version': '3.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'summary': 'Comfortable sales for your regular customers. Debt payment method for POS',
    'license': 'GPL-3',
    'category': 'Point Of Sale',
    'website': 'https://it-projects.info',
    'depends': ['point_of_sale'],
    "price": 280.00,
    "currency": "EUR",
    'images': [
        'images/screenshot-2.png',
        'images/screenshot-3.png',
        'images/screenshot-1.png',
        ],
    'data': [
        'data/product.xml',
        'views.xml',
        'data.xml',
        ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'uninstall_hook': 'pre_uninstall',
}
