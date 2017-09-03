==========================
 Hardware Network Printer
==========================

Installation
============

In PosBox
---------

* Comment out line 354 in hw_escpos/controllers/main.py, i.e. replace ``driver.push_task('printstatus')`` with ``# driver.push_task('printstatus')`` (How to do it, read `here <https://odoo-development.readthedocs.io/en/latest/admin/posbox/administrate-posbox.html#how-to-edit-odoo-source>`_).
* add hw_printer_network module to `server wide modules <https://odoo-development.readthedocs.io/en/latest/admin/posbox/administrate-posbox.html#how-to-update-odoo-command-line-options>`_

Usage
=====

Use the module together with `Pos Network Printer <https://apps.odoo.com/apps/modules/10.0/pos_printer_network>`__
