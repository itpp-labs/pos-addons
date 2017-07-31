==========================
 Hardware Network Printer
==========================

Installation
============

In PosBox
---------

* Comment out line 354 in hw_escpos/controllers/main.py, i.e. replace ``driver.push_task('printstatus')`` with ``# driver.push_task('printstatus')``

* add hw_printer_network module to server wide modules. It can be achieved by following 2 ways:

  * use server_wide_modules in odoo config file, i.e. server_wide_modules=hw_printer_network
  * specify --load parameter in run command, i.e. ./odoo-bin --load=hw_printer_network

Usage
=====

Use the module together with `Pos Network Printer <https://apps.odoo.com/apps/modules/10.0/pos_printer_network>`__


