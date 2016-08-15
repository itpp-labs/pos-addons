# -*- coding: utf-8 -*-
{
    'name': 'TG POS enhanced',
    'version': '1.0.0',
    'category': 'Hidden',
    'author': 'Thierry Godin',
    'summary': 'POS modifications',
    'description': """
It's a fork of TG_POS_ENHANCED module. It was not publish on github by author

Related links:

* http://thierry-godin.developpez.com/openerp/openerp-module-pos-enhanced-en/
* https://www.odoo.com/forum/Help-1/question/POS-Enhanced---with-screenshots--dl-link-40364

Numerous modifications of the Point Of Sale :
=============================================

    - Customer pannel
    - Editing / adding customers / link to sponsor
    - Intuitive browsing for customers (right pan) - by letter
    - Browse customer sales history : see its sales and all its products
    - Cashier pannel at bottom-left
    - POS internal messaging (instant, delayed, recurrent / text or image)
    - Special discount : shop manager can allow special discount by entering a password
    - Auto print option

    """,
    'depends': ["base", "account", "point_of_sale", "tg_partner_firstname", "tg_pos_message"],
    'data': [
        'tg_partner_view.xml',
        'security/tg_cashiers_security.xml',
        'security/ir.model.access.csv',
        'tg_cashiers_view.xml',
        'tg_order_view.xml',
        'tg_users_view.xml',
        'tg_pos_config_view.xml',
        'tg_data.xml',
    ],
    'qweb': [
        'static/src/xml/tg_pos.xml',
    ],
    # 'js': [
    #    'static/src/js/tg_pos.js',
    # ],
    # 'css':[
    #    'static/src/css/tg_pos.css',
    # ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
