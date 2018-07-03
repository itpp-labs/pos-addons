============
 WeChat API
============

.. contents::
   :local:

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Wechat libraries
----------------


* Execute next commands on your server to install obliged libraries (TODO add a link to original installation instruction)::

    apt-get install gcc
    apt-get install python3-dev
    pip install cryptography>=0.8.2
    pip install pycrypto>=2.6.1
    pip install wechatpy
    pip install wechatpy[cryptography]
    pip install wechatpy[pycrypto]
    pip install -U wechatpy

WeChat APP
==========

TODO

Configuration
=============

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Create following parameters

  * ``wechat.appId``
  * ``wechat.appSecret``
  * ``wechat.token``
