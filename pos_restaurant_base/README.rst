.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

=====================
 POS restaurant base
=====================

Technical module in POS.

The standard ``Printer`` class in ``pos_restaurant/static/src/js/multiprint.js`` does not allow you to override the functions of this class.
This module duplicates the ``Printer`` class and allows you to redefine it.

Also, here were redefined the ``computeChanges``, ``printChanges``, ``hasChangesToPrint``, ``build_line_resume`` functions from ``Order`` class and ``set_dirty`` function from ``Orderline`` class to improve speed and were added new functions such as ``print_order_receipt``, ``get_line_resume`` for speed improvement of load POS.

In the ``orderline_change`` function of the ``OrderWidget`` class, the orderline rendering was moved to a separate function to optimize the orderline rendering speed in the order after sending this orderline to the kitchen.

Usage
=====

Example of using for the Printer class

Connection::

    var Printer = require('pos_restaurant.base');

Using::

    Printer.include({
        print: function(receipt){
            // your code
            // call super method this._super(receipt);
        }

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* Dinar Gabbasov <gabbasov@it-projects.info>


Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/13.0/pos_restaurant_base/


Tested on `Odoo 13.0 <https://github.com/odoo/odoo/commit/cdfa415829fa06f2860d65054fd8534180c8526a>`_
