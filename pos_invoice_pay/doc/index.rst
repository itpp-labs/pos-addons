=====================================
 Pay Sale Orders & Invoices over POS
=====================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``[[Point of Sale]] >> Configuration >> Point of Sale`` menu

  * Click ``[Edit]``
  * Activate ``Show Sale Orders`` option
  * Activate ``Show Invoices`` option
  * Click ``[Save]``

Usage
=====

Pay Sale Orders
---------------

* Open ``[[Sales]] >> Sale Orders`` menu

  * Click ``[Create]``
  * Select a customer
  * Add products
  * Click ``[Save]``
  * Click ``[Confirm Sale]``

* Go to ``[[Point of Sale]]`` menu
* Open POS session

  * Click ``[Sale Orders]``
  * Select Sale Order
  * Click ``[Create Invoice]``
  * Select payment method on Payment screen
  * Click ``[Validate]``

* Close POS session
* Open ``[[Invoicing]] >> Sales >> Customer Invoices`` menu
* RESULT: See the corresponding paid invoice

Pay Invoices
------------

* Open ``[[Invoicing]] >> Sales >> Customer Invoices`` menu

  * Click ``[Create]``
  * Select a customer
  * Add products
  * Click ``[Save]``
  * Click ``[Validate]``

* Go to ``[[Point of Sale]]`` menu
* Open POS session

  * Click ``[Invoices]``
  * Select the invoice
  * Click ``[Create Invoice]``
  * Select payment method on Payment screen
  * Click ``[Validate]``

* Close POS session
* Open ``[[Invoicing]] >> Sales >> Customer Invoices`` menu
* RESULT: See the corresponding paid invoice
