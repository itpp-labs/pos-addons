=====================
 Pos Network Printer
=====================

Installation
============

* Install the pos_printer_network module on Odoo instance

* Add hw_printer_network module together with hw_escpos and hw_proxy to server wide modules. It can be achieved by using one of the folowing ways: 
  
  * use server_wide_modules in odoo config file, i.e. server_wide_modules=hw_escpos,hw_proxy,hw_printer_network
  * specify --load parameter in run command, i.e. ./odoo-bin --load=hw_escpos,hw_proxy,hw_printer_network

Configuration
=============

* Go to ``Point of Sale >> Configuration >> Order Printers``

  * Click on ``[Create]``
  * Specify a name of new printer in the "Printer Name" field
  * Specify the proxy server IP address of network printer
  * Check the "Network Printer" box if this printer is a network printer
  * Select Product Categories
  * Click on ``[Save]``

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Specify IP address for ``Hardware Proxy / PosBox``
  * Check the "Network Printer" box
  * Specify the network printer IP address for Receipt Printer (optional)
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

