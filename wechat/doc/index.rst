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

Credentials
-----------

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Create following parameters

  * ``wechat.app_id``
  * ``wechat.app_secret``
  * ``wechat.mch_id`` -- *Vendor ID*
  * ``wechat.sub_mch_id`` -- *Sub Vendor ID*
  * ``wechat.sandbox`` -- set to ``0`` or delete to disable. Any other value to means that sandbox is activated.

WeChat Orders sequence
----------------------

If you get error ``invalid out_trade_no``, it means that you use the same
credentials in new database and odoo sends Wechat Order IDs that were previously
used in another system. To resolve this do as following:

* Go to ``[[ Settings ]] >> Technical >> Sequence & Identifiers >> Sequences``
* Find record *WeChat Order*
* Change either **Prefix**, **Suffix** or **Next Number**
* If you get the error again, try to increase **Next Number**
