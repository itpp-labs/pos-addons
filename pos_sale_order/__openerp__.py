{
    'name' : 'Sale orders in POS',
    'version' : '1.1.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Sale',
    'website' : 'https://it-projects.info',
    'description': '''
Fill pos cart by sale order ID.

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
