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

Note
====

In the POS interface you can see the connection status of your printers by clicking on posbox icon at the top right corner.
