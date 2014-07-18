{
    'name' : 'combination of POS and e-commerce',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Sale',
    'website' : 'https://it-projects.info',
    'description': '''
    Customer create order online and buy items offline via order ID.

    ''',
    'depends' : ['point_of_sale', 'website_sale'],
    'data':[
        'data.xml',
        'views.xml',
        'templates.xml',
        'email_templates.xml',
        ],
    'qweb': ['static/src/xml/*.xml'],
    'installable': True
}
