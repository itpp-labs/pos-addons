=====================
 POS Network Printer
=====================

Installation
============

* Install the pos_printer_network module on Odoo instance

Configuration
=============

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Specify IP address for ``Hardware Proxy / PosBox``

Order Printers
--------------

* Go to ``Point of Sale >> Configuration >> Order Printers``

  * Click on ``[Create]``
  * Specify a name of new printer in the **Printer Name** field
  * Specify **IP address** of network printer
  * Check the **[x] Network Printer** box if this printer is a network printer
  * Select **Printed Product Categories**
  * Click on ``[Save]``

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Add an item (network printer) in the **Order Printers** menu
  * Click on ``[Save]``

Receipt Printer
---------------

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Check **[x] Network Printer** box for ``Hardware Proxy / PosBox``
  * Switch **Printer Type** to ``Network Printer``
  * Specify **Network Printer IP** address for Receipt Printer
  * Click on ``[Save]``

Usage
=====

Print an order
--------------

* Open POS session
* Add a product to order
* Click ``[Order]``

Print a receipt
---------------

* Open POS session
* Add a product to order
* Click on ``[Payment]`` and ``[Validate]``
* Print receipt

Check Status
------------
In the POS interface you can see the connection status of your printers by clicking on posbox icon at the top right corner.

Known Issues and workarounds
============================

Languages support
-----------------

Arabic, Japanese, Chinese and Korean `are not officially supported <https://github.com/odoo/odoo/issues/25007#issuecomment-395700893>`_. Possible workarounds are:

* `Modify posbox source <https://odoo-development.readthedocs.io/en/latest/admin/posbox/administrate-posbox.html>`_ by adding encoding of your language to `encode_char method <https://github.com/odoo/odoo/blob/21064c7de8867c9217d274cb83ff589c8ebcac75/addons/hw_escpos/escpos/escpos.py#L745-L765>`_

* Use earlier version of POSBox.
