========================
 WeChat Payments in POS
========================


Follow instructions of `WeChat API <https://apps.odoo.com/apps/modules/11.0/wechat/>`__ module.

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``[[ Point of Sale ]] >> Configuration >> Point of Sale``
* Create or select some record
* Add **Payment Methods** with non-empty value at the field **WeChat Payment**
* Close exising session for updated POSes

Usage
=====

Scanning customer's QR
----------------------

* Start POS
* Create some Order
* Click ``[Scan QR Code]`` or use QR Scanner device attached to PosBox or the device you use (computer, tablet, phone)
* Ask customer to prepare QR in WeChat app
* Scan the QR
* Wait until customer authorise the payment in his WeChat app
* RESULT: Payment is proceeded. Use your WeChat Seller control panel to see balance update.
