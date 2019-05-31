# Copyright 2016 Krotov Stanislav <https://github.com/ufaks>
# Copyright 2016-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
{
    'name': 'Confirm POS action by PIN',
    'version': '12.0.1.2.2',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'summary': 'Technical module for confirmation any action by user of specific group',
    'license': 'LGPL-3',
    'category': 'Hidden',
    "support": "pos@it-projects.info",
    'website': 'https://it-projects.info',
    'depends': ['point_of_sale'],
    'data': [
        'data.xml',
    ],

    "price": 20.00,
    "currency": "EUR",

    'installable': True,
}
