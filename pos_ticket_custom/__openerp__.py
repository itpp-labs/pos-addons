{
    'name' : 'Custom pos ticket ',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
    """,
    'depends' : ['point_of_sale', 'ir_sequence_autoreset'],
    'data':[
        'data.xml',
        'views.xml',
        ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'auto_install': False,
}
