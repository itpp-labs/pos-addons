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

Credits
=======

Contributors
------------
* krotov@it-projects.info

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`___

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/8.0

HTML Description: https://apps.odoo.com/apps/modules/8.0/pos_debt_notebook/

Usage instructions: `<doc/index.rst>`___

Changelog: `<doc/changelog.rst>`___

Tested on Odoo 8.0 b49818e1ee03205cbef1cc70c21c424ca1a9b436
