==============================
 Debt/Credit notebook for POS
==============================

Installation
============

If you have open POS session after install the module close it and open new one.
After this a debt payment method will appear in the POS.

Usage
=====

Credit Products
---------------

* Instead of using Debt Journal, customer can purchase *Credits* via *Credit Products*
* When you create *Credit product*, don't forget to set **Credit Product** field
* *Credit products* can be sold via POS and via invoices (including eCommerce). The later requires `another module <https://apps.odoo.com/apps/modules/10.0/pos_debt_notebook_sync/>`_ to notify POS about eCommerce sales, otherwise POS will get updates about invoices only after POS reloading.
* Note. Taxes on purchasing *Credit Products* are not supported. Taxes are applied on purchasings normal products.

Uninstallation
==============

Nothing special is needed to uninstall this module.
Debt data are still available after you re-install the module.
