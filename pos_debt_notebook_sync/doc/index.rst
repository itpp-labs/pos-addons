========================
 Internal Credit System
========================

Installation
============

* Check instruction for `POS longpolling <https://apps.odoo.com/apps/modules/10.0/pos_longpolling/>`_ about activating longpolling
* You probably need a module that force user to login before making purchase on website. E.g. this one: https://github.com/it-projects-llc/e-commerce/tree/10.0/website_sale_require_login

Configuration
=============

Max Debt Limit
--------------

* Go to ``Point of Sale >> Configuration >> Payment Methods``
* open journal form (e.g. ``Debt Journal``)

  * click on ``[Edit]``
  * On ``Point of Sale`` tab check the box ``Credit Journal``
  * set ``Max Debt`` value
  * click ``[Save]``

Default Max Debt
----------------

* go to ``Point of Sale >> Settings``

  * set ``Default Max Debt`` value for new customers

POS Payment
-----------

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * open POS
  * select ``Available Payment Methods``

    * ``Debt Journal`` if POS will operate with credits only
    * e.g. ``Cash`` or ``Bank`` if POS may receive a real money
    * set both if POS is used to operate with credits and real money

Credit Product
--------------

* go to ``Point of Sale >> Products``

  * click on ``[Create]``
  * open ``Invoicing`` tab
  * select an available journal in ``Journal Credit Product`` field
  * click ``[Save]``

Payment Acquirer
----------------

* open ``Invoicing >> Configuration >> Payments >> Payment Acquirer``
* select Payment Acquirer you are going to use, e.g. Paypal.

  * click ``[Edit]``
  * on ``Configuration`` tab set **Order Confirmation** field equal to ``Authorize & capture the amount, confirm the SO and auto-validate the invoice on acquirer confirmation``
  * click ``[Save]``

Usage
=====

POS sales
---------

* open one POS
* open another POS as another user
* on the first POS:

  * select customer
  * EITHER add *Credit Product* to an order and register usual payment (e.g. via Cash journal)
  * OR add usual products and register Debt payment. See `Debt notebook module <https://apps.odoo.com/apps/modules/10.0/pos_debt_notebook/>`_ for more information.
  * click ``[Validate]``

* on second POS

  * open Customer list
  * find the customer
  * customer's debt/credit is updated

eCommerce sales
---------------
* open POS
* purchase *Credit Product* via website (``/shop/...``)
* debt/credit value on POS is updated
