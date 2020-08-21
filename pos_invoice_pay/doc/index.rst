========================
 POS: Pay SO & Invoices
========================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``[[Point of Sale]] >> Configuration >> Point of Sale`` menu

  * Select POS
  * Click ``[Edit]``
  * Activate ``Show Sale Orders`` option
  * Activate ``Show Invoices`` option
  * Click ``[Save]``

Enable the ability to give change to the client
-----------------------------------------------

* Go to ``[[Point of Sale]] >> Configuration >> Point of Sale`` menu

  * Select POS
  * Click ``[Edit]``
  * Set ``Difference Account`` field
  * Click ``[Save]``

Usage
=====

Pay Sale Orders
---------------

* Open ``[[Sales]] >> Orders >> Orders`` menu

  * Click ``[Create]``
  * Select a customer
  * Add products
  * Click ``[Save]``
  * Click ``[Confirm]``

* Go to ``[[Point of Sale]]`` menu
* Open POS session

  * Click ``[Fetch Orders]``
  * Select Sale Order
  * Click ``[Create Invoice]``
  * Select payment method on Payment screen
  * Click ``[Validate]``

* Close POS session
* Open ``[[Invoicing]] >> Customers >> Invoices`` menu
* RESULT: See the corresponding paid invoice

Pay Invoices
------------

* Open ``[[Invoicing]] >> Customers >> Invoices`` menu

  * Click ``[Create]``
  * Select a customer
  * Add products
  * Click ``[Save]``
  * Click ``[Validate]``

* Go to ``[[Point of Sale]]`` menu
* Open POS session

  * Click ``[Fetch Invoices]``
  * Select the invoice
  * Click ``[Register Payment]``
  * Select payment method on Payment screen
  * Click ``[Validate]``

* Close POS session
* Open ``[[Invoicing]] >> Customers >> Invoices`` menu
* RESULT: See the corresponding paid invoice
