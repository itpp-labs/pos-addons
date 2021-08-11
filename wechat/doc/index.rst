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

* Be sure that your server available for requests from outside world (i.e. it shall not be avaialble in local network only)

Multi database
--------------

If you have several databases, you need to check that all requests are sent to the desired database. The notification request from the WeChat cloud does not contain session cookies. So, if Odoo cannot determine which database to use, it will return a 404 error (Page not found).
In order for the requests to send to the desired database, you need to configure `dbfilter <https://odoo-development.readthedocs.io/en/latest/admin/dbfilter.html>`__.

WeChat APP
==========

Check WeChat documentation or contact WeChat Support about obtaining APP credentials.

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
  * ``wechat.mch_cert``, ``wechat.mch_key`` -- **path** to key and certificate files at server. Example of values:

    * ``wechat.mch_cert``: ``/path/to/apiclient_cert.pem``
    * ``wechat.mch_key``: ``/path/to/apiclient_key.pem``

  * ``wechat.payment_result_notification_url`` -- optional. Use it if doesn't work automatiically. The url must be ``http(s)://YOUR_HOST/wechat/callback``.

Internal Numbers
----------------

If you get error ``invalid out_trade_no``, it means that you use the same
credentials in new database and odoo sends Wechat Order IDs that were previously
used in another system. To resolve this do as following:

* Go to ``[[ Settings ]] >> Technical >> Sequence & Identifiers >> Sequences``
* Find record *WeChat Order*, *Wechat Refund* or *Wechat Micropay*, depending on which request has the problem
* Change either **Prefix**, **Suffix** or **Next Number**
* If you get the error again, try to increase **Next Number**

Wechat tracking
---------------
Wechat records (Orders, Micropays, Refunds, etc.) can be found at ``[[ Invoicing ]] >> Configuration >> Wechat``. If you don't have that menu, you need to configure ``Show Full Accounting Features`` for your user first:

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Users & Companies >> Users``
* Open user you need
* Activate ``Show Full Accounting Features``
