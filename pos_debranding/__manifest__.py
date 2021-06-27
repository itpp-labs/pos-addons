# Copyright 2015-2018,2020 Ivan Yelizariev
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": "POS debranding",
    "version": "14.0.1.0.0",
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "license": "Other OSI approved licence",  # MIT
    "category": "Debranding",
    "support": "help@itpp.dev",
    "website": "https://odoo-debranding.com",
    "depends": ["point_of_sale"],
    "data": ["template.xml"],
    "qweb": ["static/src/xml/pos_debranding.xml"],
    "installable": True,
}
