=====================================
 Pay Sale Orders & Invoices over POS
=====================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

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

  * Click ``[Fetch Orders]``
  * Select Sale Order
  * Click ``[Create Invoice]``
  * Select payment method on Payment screen
  * Click ``[Validate]``

* Close POS session
* Open ``[[Invoicing]] >> Sales >> Customer Invoices`` menu
* See the corresponding paid invoice
	
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

  * Click ``[Fetch Invoices]``
  * Select the invoice
  * Click ``[Create Invoice]``
  * Select payment method on Payment screen
  * Click ``[Validate]``

* Close POS session
* Open ``[[Invoicing]] >> Sales >> Customer Invoices`` menu
* See the corresponding paid invoice
