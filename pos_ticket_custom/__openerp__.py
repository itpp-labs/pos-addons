{
    'name' : 'Custom pos ticket ',
    'version' : '1.0.0',
    'author' : 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category' : 'Point Of Sale',
    'website' : 'https://yelizariev.github.io',
    'description': """
    module *ir_sequence_autoreset* is available here: https://github.com/yelizariev/addons-yelizariev
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
