{
    "name": "POS: Out-of-stock orders",
    "version": "10.0.1.1.0",
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "summary": "Only supervisor can approve POS Order with out-of-stock product",
    "license": "Other OSI approved licence",  # MIT
    "category": "Point Of Sale",
    "support": "help@itpp.dev",
    "website": "https://twitter.com/OdooFree",
    "depends": ["pos_pin", "pos_product_available"],
    "data": ["data.xml", "views.xml"],
    "installable": True,
}
