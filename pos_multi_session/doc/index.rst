==========================================
 Sync POS orders across multiple sessions
==========================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Longpolling
-----------

Follow instruction of https://www.odoo.com/apps/modules/10.0/pos_longpolling/

Configuration
=============

To create a multi-session follow the steps:

* Open menu ``[[ Point of Sale ]] >> Configuration >> Multi-session Settings``
* Click ``[Create]``
* Specify a name for multi-session in the **Name** field
* Choose POSes you want to add in the multi-session. Their previous sessions have to be closed before adding.
* Click ``[Save]``

Domain switching
================

There is a rare case, when you need to clear browser data after installation: if you use this module on a website domain, which was previously used by another database with this module installed (e.g. main_company.example.com was used by ``database1`` and then the domain starts to handle another ``database2``). In that case the browser data has to be cleaned on all devices before first use.

Modules compatibility
=====================

The ``pos_multi_session`` is compatible with all IT-Projects` modules. It may not be compatible with other third-party modules that add additional data to Order or Orderline js model. For such cases we provide developer instruction how to add compatibility (available in README.rst file).

Usage
=====

Several POSes can't be opened in the same browser simultaneously.
After completing previous paragraphs and adding at least two poses to a multi-session:

* Open two or more POSes belonging to the multi-session
* In the first POS add a product
* In the opened POSes you will see the product in order list and underline note signifying that it was added by the first POS and the number of the order was changed from ``NEW`` to a number
* In the second POS click on the orderline and click a number by using numpad to change quantity of that product
* In opened POSes you will see the changed quantity of the product and information about the orderline was added by the first and changed by the second POSes

Same POS can be used on the different devices, but be sure you do not launch them simultaneously.
You need to wait for the POS loading on one device before start it on the another.
Otherwise you may lose an order data. Fix for the problem: https://github.com/odoo/odoo/pull/24486
