{
    'name' : 'Debt payment for POS (TG)',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
POS interface for debt notebook. Addon is based on **tg_pos_enhanced** and **pos_debt_notebook** addons
    """,
    'depends' : ['tg_pos_enhanced', 'pos_debt_notebook'],
    'data':[
        ],
    'qweb': [
        'static/src/xml/tg_pos.xml',
    ],
    'js': [
        'static/src/js/tg_pos.js',
    ],
    'css':[
        'static/src/css/tg_pos.css',
    ],
    'installable': True,
    'auto_install': True
}
# and  !widget.pos.get('selectedOrder').get_partner_id()
