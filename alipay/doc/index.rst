============
 Alipay API
============

.. contents::
   :local:

Installation
============

* Install `alipay library<https://github.com/fzlee/alipay>`__::

    pip install python-alipay-sdk

    # to update existing installation use
    pip install -U python-alipay-sdk

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
  * ``alipay.app_private_key`` -- path to file
  * ``alipay.app_public_key`` -- path to file
  * ``alipay.alipay_public_key_string`` -- content of public key file. Starts with ``-----BEGIN PUBLIC KEY-----``
  * ``alipay.app_auth_code``
  * ``alipay.app_auth_token``

Internal Numbers
----------------

If you get error ``invalid out_trade_no``, it means that you use the same
credentials in new database and odoo sends Alipay Order IDs that were previously
used in another system. To resolve this do as following:

* Go to ``[[ Settings ]] >> Technical >> Sequence & Identifiers >> Sequences``
* Find record *Alipay Order* or *Alipay Refund**, depending on which request has the problem
* Change either **Prefix**, **Suffix** or **Next Number**
* If you get the error again, try to increase **Next Number**

Alipay tracking
---------------
Alipay records (Orders, Refunds, etc.) can be found at ``[[ Invoicing ]] >> Configuration >> Alipay``. If you don't have that menu, you need to configure ``Show Full Accounting Features`` for your user first:

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Users & Companies >> Users``
* Open user you need
* Activate ``Show Full Accounting Features``
