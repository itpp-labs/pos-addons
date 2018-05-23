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

Credits
=======

Contributors
------------
* Dinar Gabbasov <gabbasov@it-projects.info>

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_restaurant_base/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 10.0 9e159ef2048574d179a9afb2226397e962aa5725
