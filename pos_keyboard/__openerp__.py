# -*- coding: utf-8 -*-
{
    'name': "pos_keyboard",
    'summary': "usb keyboard in point of sale",
    'description': """
Module to connect an additional usb keyboard for Point of Sale.
--------------------------------------------------------------
The processed keys:\n number: 0-9\n mode: qty: "/" disc: "-" price: "*"\n dot: "."\n backspace: 'backspace'\n

""",
    'author': "Ivan Yelizariev",
    "website" : "https://yelizariev.github.io",
    'category' : 'Point Of Sale',
    'version': '1.0.0',
    'depends': ['point_of_sale'],
    'data': [
         'data.xml',
    ],
    'installable': True,
    'auto_install': False,
}
