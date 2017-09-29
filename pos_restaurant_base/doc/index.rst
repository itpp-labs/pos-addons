==========================
 Hardware Network Printer
==========================

Technical module in POS.

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

Connection::

    var Printer = require('pos_restaurant.base');

Using::

    Printer.include({
        print: function(receipt){
            // your code
            // call super method this._super(receipt);
        }
