.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

=======================
 Debt notebook for POS
=======================

The module allows to make sale on credit.

The module has the following behavior:

* Debt data are still available after the module will be re-installed.
* When new (first after install) POS session is opened, a debt payment method would added in a POS config.
* Odoo tests are passed.
* Multicompany mode support.
* If the module was install and uninstall immediately (without created POS sessions) then it keeps no data.   
* If a user deleted debt journal from POS config manually then after the module is upgraded 
  POS config would not be changed. 
* Upgrading from old versions is well.

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* krotov@it-projects.info

Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/8.0/pos_debt_notebook/


Tested on `Odoo 8.0 <https://github.com/odoo/odoo/commit/b49818e1ee03205cbef1cc70c21c424ca1a9b436>`_
