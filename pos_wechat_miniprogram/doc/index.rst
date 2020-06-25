==========================
 POS: WeChat Mini-program
==========================

Follow instructions of `WeChat API <https://apps.odoo.com/apps/modules/11.0/wechat_miniprogram/>`__ module.

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

WeChat mini-program Journals
----------------------------

WeChat mini-program Journals are created automatically on first opening new POS session.

* In demo installation: they are availabe in POS immediatly
* In non-demo installation: add Journals to **Payment Methods** in *Point of
  Sale*'s Settings, then close existing session if any and open again

Usage
=====

Generate mini-program QR Codes for tables of restaurant
-------------------------------------------------------

* Go to ``[[ Point of Sale ]] >> WeChat mini-program >> QR Code``
* Specify ``Floor``
* Specify ``Quantity`` - quantity of QR codes for each table
* Specify ``Tables`` of the ``Floor``
* Click on ``[Print]``
* RESULT: You will get a PDF report with QR codes.

Usage of POS
------------
* Go to ``[[ Point of Sale ]] >> Configuration >> Point of Sale``
* Open ``POS`` form
* Click on ``[Edit]``
* Specify ``Allow receiving messages``
* Specify ``Auto Print miniprogram Orders``
* Click on ``[Save]``
* Open ``POS`` session
* Create ``Order`` from WeChat mini-program and pay via mini-program
* Click ``Validate`` in the POS for confirming the ``Order``
* Create new ``Order`` from WeChat mini-program without pay
* Click ``Payment`` in the POS for payment the ``Order``
