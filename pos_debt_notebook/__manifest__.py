# Copyright 2014-2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2015 Bassirou Ndaw <https://github.com/bassn>
# Copyright 2015 Alexis de Lattre <https://github.com/alexis-via>
# Copyright 2016-2017 Stanislav Krotov <https://it-projects.info/team/ufaks>
# Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# Copyright 2017 Artyom Losev
# Copyright 2017 Lilia Salihova
# Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": "POS: Prepaid credits",
    "summary": "Comfortable sales for your regular customers. Debt payment method for POS",
    "category": "Point Of Sale",
    "images": ["images/debt_notebook.png"],
    "version": "14.0.5.3.4",
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons/",
    "license": "Other OSI approved licence",  # MIT
    "external_dependencies": {"python": [], "bin": []},
    "depends": ["point_of_sale"],
    "data": [
        "security/pos_debt_notebook_security.xml",
        "data/product.xml",
        "views/pos_debt_report_view.xml",
        "views.xml",
        "views/pos_credit_update.xml",
        "wizard/pos_credit_invoices_views.xml",
        "wizard/pos_credit_company_invoices_views.xml",
        "data.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [
        "static/src/xml/CreditNote.xml",
        "static/src/xml/OrderReceipt.xml",
        "static/src/xml/PaymentMethodButton.xml",
        "static/src/xml/ReceiptScreen.xml",
        "static/src/xml/pos.xml",
    ],
    "demo": ["data/demo.xml"],
    "installable": True,
    "uninstall_hook": "pre_uninstall",
}
