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

Buyer presents the pay code, Vendor scans the code to finish the transaction.

Native Payment (QR Code Payment)
--------------------------------

The Vendor gets one-time url and shows it to Buyer as a QR Code, Buyer scans to finish the transaction.

Official Account Payment
------------------------

There are two types of usage:

* **In-App Web-based Payment** -- The Payer opens the Vendor's HTML5 pages on their WeChat and calls the WeChat payment module via the JSAPI interface to pay their transaction. Client side of this process (i.e. web pages) is not supported. While it could be implemented as additional module, we recommend to develop *Mini programs* instead.
* **Mini program** -- an application as a part of WeChat App is created via *WeChat Developer tools*.

In-App Payment
--------------

This payment way is only for native mobile application. This module provides server part of the process.

WeChat Documentation & tools
============================

Sandbox & Debugging
-------------------

* API Debug Console https://open.wechat.com/cgi-bin/newreadtemplate?t=overseas_open/docs/oa/basic-info/debug-console
* Creating Test Accounts https://admin.wechat.com/debug/cgi-bin/sandbox?t=sandbox/login

  * Note: it may not work from non-chinese IP addresses
  * You will get ``appid`` and ``appsecret`` values
  * To work with WeChat payments you also need Merchant ID, which this sandbox
    doesn't provide. It seems, that to work with Payments you need a real
    account and use *sandbox* mode (*System Parameter* ``wechat.sandbox``).

Payments
--------

* https://pay.weixin.qq.com/wechatpay_guide/help_docs.shtml

Debugging
=========

Local Debug
-----------

To debug UI, create *System Parameter* ``wechat.local_sandbox`` with value ``1``. All requests to wechat will return fake result without making a request.

Native Payments debugging
-------------------------

* It seems that in sandbox mode it's allowed to use only prices ``1.01`` and ``1.02``.

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__

Sponsors
--------
* `Sinomate <http://sinomate.net/>`__

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
