==========================
 Hardware Network Printer
==========================

Installation
============

In PosBox
---------

* add ``hw_printer_network`` module to *server wide modules*.

Detailed instruction is here: https://odoo-development.readthedocs.io/en/latest/admin/posbox/administrate-posbox.html#how-to-update-odoo-command-line-options

Usage
=====

* To know how to update odoo command-line options and edit odoo source follow this `video <https://drive.google.com/file/d/1tdQAOldgFO96x5fvbEI-H84Qdmcg3DR2/view>`__ .

.. note::
    Use the module together with `Pos Network Printer <https://apps.odoo.com/apps/modules/10.0/pos_printer_network>`__

    Networking works only for printers, but not for cashdrivers linked to network printers

    * HTTPS
    * IOTBOX IP-address format:  https://192.168.1.2.
    * Network Printers IP-address format:  https://192.168.1.200
    * USB Printer IP-address format:   https://192.168.1.2:443

