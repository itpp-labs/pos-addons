==========================
 Hardware Network Printer
==========================

Installation
============

In PosBox
---------

* add ``hw_printer_network`` module to *server wide modules*. Detailed instruction is here: https://odoo-development.readthedocs.io/en/latest/admin/posbox/administrate-posbox.html#how-to-update-odoo-command-line-options

* If you use posbox version 17.0 and newer:
    * In PosBox implement the next command::

        sudo su
        mount -o rw,remount /
        PRINTER_PY=/home/pi/odoo/addons/hw_escpos/escpos/printer.py
        sed -i "s;\
        self\.device\.send(msg);\
        if type(msg) is str:\n\
                    msg = msg.encode(\"utf-8\")\n\
                self\.device\.send(msg);" \
        $PRINTER_PY


Usage
=====

Use the module together with `Pos Network Printer <https://apps.odoo.com/apps/modules/10.0/pos_printer_network>`__
