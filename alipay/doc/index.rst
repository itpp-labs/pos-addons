============
 Alipay API
============

.. contents::
   :local:

Installation
============

* Install `alipay library<https://github.com/jxtech/alipay>`__::

    pip install alipay
    pip install alipay[cryptography]

    # to update existing installation use
    pip install -U alipay

Multi database
--------------

If you have several databases, you need to check that all requests are sent to the desired database. The user authentication request from the Mini-program does not contain session cookies. So, if Odoo cannot determine which database to use, it will return a 404 error (Page not found).
In order for the requests to send to the desired database, you need to configure `dbfilter <https://odoo-development.readthedocs.io/en/latest/admin/dbfilter.html>`__.

Alipay APP
==========

TODO

Configuration
=============

Credentials
-----------

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Create following parameters

  * ``alipay.app_id``
  * ``alipay.app_secret``
  * ``alipay.miniprogram_app_id``
  * ``alipay.miniprogram_app_secret``
  * ``alipay.mch_id`` -- *Vendor ID*
  * ``alipay.sub_mch_id`` -- *Sub Vendor ID*
  * ``alipay.sandbox`` -- set to ``0`` or delete to disable. Any other value to means that sandbox is activated.
  * ``alipay.mch_cert``, ``alipay.mch_key`` -- **path** to key and certificate files at server. Example of values:

    * ``alipay.mch_cert``: ``/path/to/apiclient_cert.pem``
    * ``alipay.mch_key``: ``/path/to/apiclient_key.pem``

Internal Numbers
----------------

If you get error ``invalid out_trade_no``, it means that you use the same
credentials in new database and odoo sends Alipay Order IDs that were previously
used in another system. To resolve this do as following:

* Go to ``[[ Settings ]] >> Technical >> Sequence & Identifiers >> Sequences``
* Find record *Alipay Order*, *Alipay Refund* or *Alipay Micropay*, depending on which request has the problem
* Change either **Prefix**, **Suffix** or **Next Number**
* If you get the error again, try to increase **Next Number**

Alipay tracking
---------------
Alipay records (Orders, Micropays, Refunds, etc.) can be found at ``[[ Invoicing ]] >> Configuration >> Alipay``. If you don't have that menu, you need to configure ``Show Full Accounting Features`` for your user first:

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Users & Companies >> Users``
* Open user you need
* Activate ``Show Full Accounting Features``

Alipay Journals
---------------

Alipay Journals are created automatically on first opening POS session.

* In demo installation: they are availabe in POS immediatly
* In non-demo installation: add Journals to **Payment Methods** in *Point of
  Sale*'s Settings, then close existing session if any and open again
