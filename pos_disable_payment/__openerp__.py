{
    'name': "Disable payments in POS",
    'summary': "Control access to the POS payments",
    'version': '11.0.3.6.1',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'LGPL-3',
    'category': 'Point Of Sale',
    'live_test_url': 'http://apps.it-projects.info/shop/product/pos-multi-session?version=11.0',
    "support": "apps@it-projects.info",
    'website': 'https://yelizariev.github.io',
    'depends': [
        'point_of_sale'
    ],
    'images': ['images/pos_payment_access.png'],
    "price": 40.00,
    "currency": "EUR",
    'data': [
        'views.xml',
    ],
    'demo': [
        'views/assets_demo.xml',
    ],
    'installable': True,
}
