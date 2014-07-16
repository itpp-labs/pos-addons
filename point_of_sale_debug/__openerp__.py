{
    'name' : 'POS web-client debug',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': '''
Addon modify pos/web controller to load raw js (not minified)

    /pos/web_debug?debug=1

    ''',
    'depends' : ['point_of_sale'],
    'data':[
        'templates.xml',
        ],
    'installable': True
}
