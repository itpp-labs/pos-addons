========================
 Internal Credit System
========================

Installation
============

* Check instruction for `POS longpolling <https://apps.odoo.com/apps/modules/13.0/pos_longpolling/>`_ about activating longpolling
* You probably need a module that force user to login before making purchase on website. E.g. this one: https://github.com/OCA/e-commerce/tree/13.0/website_sale_require_login

Configuration
=============

Max Debt Limit
--------------

* Go to ``Point of Sale >> Configuration >> Payment Methods``
* Open one of the ``Payment methods``
* Open journal form (e.g. ``Credits``)
  * go inside Cash Journal
  * click on ``[Edit]``
  * On ``Point of Sale`` tab check the box ``Credit Journal``
  * set ``Max Debt`` value
  * click ``[Save]``

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
  * open ``Point of Sale`` tab
  * select an available journal in ``Journal Credit Product`` field
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
  * OR add usual products and register Debt payment. See `Debt notebook module <https://apps.odoo.com/apps/modules/13.0/pos_debt_notebook/>`_ for more information.
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
