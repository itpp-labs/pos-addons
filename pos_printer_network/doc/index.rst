=====================
 POS Network Printer
=====================

Installation
============

* Install the hw_printer_network module on POS Box
* Install the pos_printer_network module on Odoo instance

Configuration
=============

* go to ``Point of Sale >> Order Printers``

  * Click on ``[Create]``
  * Specify a name of new printer in the "Printer Name" field
  * Specify the proxy server IP address of network printer
  * Check the box "Network Printer" as True if this printer is a network printer
  * Specify Product Categories
  * Click ``[Save]``

* go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Add an item (new printer) in the "Order Printers" menu
  * Click ``[Save]``
  * Specify the proxy server IP address in "Hardware Proxy / PosBox" section
  * Specify the network printer ip address for Receipt Printer

Usage
=====

* Open POS session
* Add new product to order
* Click ``[Order]``

Note
====

In the POS interface the printer status refers to the usb printers only.
