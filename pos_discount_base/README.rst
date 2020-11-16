.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

===================
 POS Discount base
===================

Technical module that applies some refactoring on built-in ``pos_discount`` module to allow easily extend its methods.

More details:

* method ``button_click`` is moved to OrderWidget with new name ``discount_button_click``.
* callback on confirming discount is a new method ``confirm_discount`` in OrderWidget 
* method ``apply_discount`` is moved to OrderWidget with the same name.

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__


Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/10.0/pos_discount_base/


Tested on `Odoo 10.0 <https://github.com/odoo/odoo/commit/a63ecee47ac271b1f0a23528d9d5eab7f63ae528>`_
