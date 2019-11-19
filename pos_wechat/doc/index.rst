========================
 WeChat Payments in POS
========================


Follow instructions of `WeChat API <https://apps.odoo.com/apps/modules/13.0/wechat/>`__ module.

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

WeChat Journals
---------------

WeChat Journals are created automatically on first opening new POS session.

* In demo installation: they are availabe in POS immediatly
* In non-demo installation: add Journals to **Payment Methods** in *Point of
  Sale*'s Settings, then close existing session if any and open again

Usage
=====

Show QR to customer
-------------------

* Start POS
* Create some Order
* Go to Payment screen
* Click on journal *Wechat Native Payment*
* RESULT: QR is shown on Screen and Customer Screen (when available)

Scanning customer's QR
----------------------

* Start POS
* Create some Order
* Click ``[Scan QR Code]`` or use QR Scanner device attached to PosBox or the device you use (computer, tablet, phone)
* Ask customer to prepare QR in WeChat app
* Scan the QR
* Wait until customer authorise the payment in his WeChat app
* RESULT: Payment is proceeded. Use your WeChat Seller control panel to see balance update.

Refunds
-------

* Make Refund Order via backend as usual:

  * Go to ``[[ Point of Sale ]] >> Orders >> Orders``
  * Open product to be refuned
  * Click button ``[Return Products]``

* In Refund Order click ``[Payment]``
* In **Payment Mode** specify a WeChat journal
* Depending on type of WeChat journal specify either **WeChat Order to refund**
  or **Micropay to refund**
