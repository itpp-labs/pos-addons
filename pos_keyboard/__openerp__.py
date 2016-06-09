# -*- coding: utf-8 -*-
{
    'name': "Keyboard support in Point Of Sale",
    'author': "IT-Projects LLC, Ivan Yelizariev",
    'summary': 'Module allows to use usual keyboard (not virtual one) in Point of Sale',
    "website": "https://it-projects.info",
    'images': ['images/keyboard.png'],
    'category': 'Point Of Sale',
    'version': '1.0.2',
    'depends': ['point_of_sale'],
    'js': [
         'static/src/js/pos.js',
    ],
    'installable': True,
    'auto_install': False,
    'description': """
Keyboard support in Point Of Sale
================================================================
Module allows to use usual keyboard (not virtual one) in Point of Sale.

Usage:
------
Using keys below switch to mode you need. Qty mode is used by default.
Then use number keys to enter quantity, price or discount.


=========== ===================== =================
Type        Numpad                Extra keys  
=========== ===================== =================
mode qty    ``/``                 ``q``
----------- --------------------- -----------------
mode disc   ``-``                 ``d``
----------- --------------------- -----------------
mode price  ``*``                 ``p``
----------- --------------------- -----------------
+/-         ``+``                 ``s``
=========== ===================== =================
""",
}
