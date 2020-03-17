=======================
 POS: Refunds analysis
=======================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``Point of Sale >> POS Product Cancellation Reason``

  * Click on ``[Create]``
  * Specify a cancellation reason
  * Click ``[Save]``

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Select ``Ask reason for kitchen orders only`` if needed. Otherwise waiter is
    asked for reason for any product removings. Facts of removing are registered
    at backend at any way.
  * Click on ``[Save]``

Usage
=====

* Open POS session
* On canceling one product at an order:

  * create order with few lines
  * Remove kitchen product or decrease its quantity
  * Specify cancellation reason or set custom one
  * Click ``[Ok]``
  * Click ``[Order]`` to print cancellation receipt -- receipt contains cancellation reason

* On canceling whole order:

  * Create order with few lines
  * Remove order by clicking Minus Button near the order tabs
  * Specify cancellation reason or set custom one
  * Click ``[Ok]``

* At backend go to ``Point of Sale >> Reports >> Refunds / Cancellations``

  * Switch to list view
  * You can see all information about canceled products
