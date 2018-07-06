============
 WeChat API
============

Basic tools to integrate Odoo and WeChat.

.. contents::
   :local:

Payment methods
===============

Quick Pay (micropay)
--------------------

Buyer presents the pay code, vendor scans the code to finish the transaction.

Native Payment (QR Code Payment)
--------------------------------
*Not supported yet*

The Vendor generates a transaction QR Code, Buyer scans to finish the transaction.

In-App Web-based Payment (Official Account Payment)
---------------------------------------------------
*Not supported yet*

The Payer opens the Vendor's HTML5 pages on their WeChat and calls the WeChat payment module via the JSAPI interface to pay their transaction. 

In-App Payment
--------------

This payment way is only for native mobile application and not supposed to be implemented in an odoo module

WeChat Documentation & tools
============================

Sandbox & Debugging
-------------------

* API Debug Console https://open.wechat.com/cgi-bin/newreadtemplate?t=overseas_open/docs/oa/basic-info/debug-console
* Creating Test Accounts https://admin.wechat.com/debug/cgi-bin/sandbox?t=sandbox/login

  * Note: it may not work from non-chinese IP addresses
  * You will get ``appid`` and ``appsecret`` values
  * WeChat payments: no need to submit extra information

Payments
--------

* https://pay.weixin.qq.com/wechatpay_guide/help_docs.shtml

Debugging
=========

To debug UI, create *System Parameter* ``wechat.local_sandbox`` with value ``1``. All requests to wechat will return fake result without making a request.

Credits
=======

Contributors
------------
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/misc-addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/wechat/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
