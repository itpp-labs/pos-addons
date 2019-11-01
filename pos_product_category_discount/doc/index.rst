=======================
 POS Discount Programs
=======================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

Create Discount Program
-----------------------

* Open ``Point of Sale >> Configuration >> POS Discount Programs``  menu
* Click on ``[Create]``
* Specify the fields:

  * Name
  * Discount Categories

* Click on ``[Save]``

Enable Discounts for POS
-----------------------

* Open ``Point of Sale >> Configuration >> Point of Sale`` menu
* Open available POS
* Click on ``[Edit]``
* Scroll down to ``Pricing`` section
* Check the box ``Global Discounts``
* Click on ``[Save]``

Disable discount for product
----------------------------

* Go to ``Point of Sale >> Orders >> Products`` menu
* Open a product form
* Click on ``[Edit]``
* Go to ``Sales`` tab
* Uncheck the box ``Discount allowed`` to disable discount for product

Usage
=====

* Go to ``Point of Sale >> Dashboard`` menu
* Open POS session
* Click on ``[Discount]``
* Select any discount program
* Click on ``[Apply]``
* See discounts applied to corresponding order lines
