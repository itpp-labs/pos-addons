============================
 Sync Debt notebook for POS
============================

Installation
============

* Check instruction for `POS longpolling <https://apps.odoo.com/apps/modules/10.0/pos_longpolling/>`_ about activating longpolling
* You probably need a module that force user to login before making purchase on website. E.g. this one: https://github.com/it-projects-llc/e-commerce/tree/10.0/website_sale_require_login

Configuration
=============

Payment Acquirer
----------------

* open ``Invoicing >> Configuration >> Payments >> Payment Acquirer``
* select Payment Acquirer you are going to use, e.g. Paypal.

  * click ``[Edit]``
  * On ``Configuration`` tab set **Order Confirmation** field equal to ``Authorize & capture the amount, confirm the SO and auto-validate the invoice on acquirer confirmation``
  * click ``[Save]``

Usage
=====

POS sales
---------

* open one POS
* open another POS as another user
* on first POS:

  * select customer
  * EITHER add *Credit Product* to an order and register usual payment (e.g. via Cash journal)
  * OR add usual products and register Debt payment. See `Debt notebook module <https://apps.odoo.com/apps/modules/10.0/pos_debt_notebook/>`_ for more information.
  * click ``[Validate]``

* on second POS

  * open Customer list
  * find the customer
  * customer's debt is updated

eCommerce sales
---------------
* open POS
* purchase *Credit Product* via website (``/shop/...``)
* debt value on POS is updated

