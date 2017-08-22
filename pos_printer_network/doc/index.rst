=====================
 Pos Network Printer
=====================

Installation
============

* Install the pos_printer_network module on Odoo instance

Configuration
=============

* Go to ``Point of Sale >> Configuration >> Order Printers``

  * Click on ``[Create]``
  * Specify a name of new printer in the "Printer Name" field
  * Specify the IP address of network printer
  * Check the "Network Printer" box if this printer is a network printer
  * Select Product Categories
  * Click on ``[Save]``

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Specify IP address for ``Hardware Proxy / PosBox`` -- the hostname or ip address of the your PosBox. It will be looked up in local network, if is not set.
  * Switch **Printer Type** to *Network Printer*
  * Specify the network printer IP address for Receipt Printer
  * Add an item (network printer) in the "Order Printers" menu
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
