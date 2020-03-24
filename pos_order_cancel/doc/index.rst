=========================
 POS: reason for removal
=========================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``Point of Sale >> Settings >> Refund / Cancellation Reasons``

  * Click on ``[Create]``
  * Specify a cancellation reason
  * Click ``[Save]``

Usage
=====

* Open POS session
* On canceling one product at an order:

  * create order with few lines
  * Remove product or decrease its quantity
  * Specify cancellation reason or set custom one
  * Click ``[Ok]``

* On canceling whole order:


  * Create order with few lines
  * Remove order by clicking Minus Button near the order tabs
  * Specify cancellation reason or set custom one
  * Click ``[Ok]``

* At backend go to ``Point of Sale >> Reports >> Refunds / Cancellations``

  * Switch to list view
  * You can see all information about canceled products
