============================
 Payments in POS via Wechat
============================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

Wechat URL verification
-----------------------

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Click ``[Create]``

  * Specify 'wechat.appId' in the field **Key**
  * Specify your obtained from wechat APPID in the field **Value**

* Click ``[Save]``

* Also create keys 'wechat.appSecret' and 'wechat.token'
