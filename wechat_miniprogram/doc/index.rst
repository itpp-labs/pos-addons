=========================
 WeChat mini-program API
=========================

Follow instructions of `WeChat API <https://apps.odoo.com/apps/modules/11.0/wechat/>`__ module.

Installation
============

Multi database
--------------

If you have several databases, you need to check that all requests are sent to the desired database. The user authentication request from the Mini-program does not contain session cookies. So, if Odoo cannot determine which database to use, it will return a 404 error (Page not found).
In order for the requests to send to the desired database, you need to configure `dbfilter <https://odoo-development.readthedocs.io/en/latest/admin/dbfilter.html>`__.

Configuration
=============

Credentials
-----------

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Create following parameters

  * ``wechat.miniprogram_app_id``
  * ``wechat.miniprogram_app_secret``
