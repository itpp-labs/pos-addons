=======================
 Tencent Cloud SMS API
=======================

.. contents::
   :local:

Installation
============

* Install `qcloudsms_py library <https://github.com/qcloudsms/qcloudsms_py>`__::

    pip install qcloudsms_py

    # to update existing installation use
    pip install -U qcloudsms_py


Tencent Cloud SMS API
=====================

TODO

Configuration
=============

Credentials
-----------

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Create following parameters

  * ``qcloudsms.app_id``
  * ``qcloudsms.app_key``


SMS Tracking
------------
ALL SMS messages can be found at ``[[ Settings ]] >> Tencent Cloud SMS >> Messages``. If you don't have that menu, you need to `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__

SMS Templates
-------------
* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Tencent Cloud SMS >> Templates``
* Click on ``[Create]``
* Specify ``Name`` and ``SMS Type``
* If necessary, specify other fields
* Click on ``[Save]``

SMS Templates params
--------------------

``domestic_template_params`` or ``international_template_params`` - the array of template values. The parameters must be separated by commas. If the template has no parameters, leave it empty.

For example:

If the template has the following format:
``Your login verification code is {1}, which is valid for {2} minutes.`` and the params have the following values: ``['123456', '5']``, after sending an SMS we receive the message: ``Your login verification code is 123456, which is valid for 5 minutes.``
