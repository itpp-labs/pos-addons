============
 WeChat API
============

.. contents::
   :local:

Installation
============

* Install `wechatpy library<https://github.com/jxtech/wechatpy>`__::

    pip install wechatpy
    pip install wechatpy[cryptography]

    # to update existing installation use
    pip install -U wechatpy

WeChat APP
==========

TODO

Configuration
=============

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Create following parameters

  * ``wechat.app_id``
  * ``wechat.app_secret``
  * ``wechat.mch_id`` -- *Vendor ID*
  * ``wechat.sub_mch_id`` -- *Sub Vendor ID*
  * ``wechat.sandbox`` -- set to ``0`` or delete to disable. Any other value to means that sandbox is activated.
