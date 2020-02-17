# -*- coding: utf-8 -*-
{
    "name": "Product lot in POS",
    "version": "10.0.1.0.3",
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "license": "Other OSI approved licence",  # MIT
    "category": "Point Of Sale",
    "website": "https://twitter.com/yelizariev",
    "images": ["images/screenshot.png"],
    "price": 9.00,
    "currency": "EUR",
    "depends": ["product_lot", "pos_product_available"],
    "data": ["data.xml"],
    "qweb": ["static/src/xml/pos.xml"],
    "installable": True,
    "auto_install": False,
}
