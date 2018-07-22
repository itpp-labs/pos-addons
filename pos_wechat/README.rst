========================
 WeChat Payments in POS
========================

Payment the workflow is as following:

* Cashier creates order and scan user's QR in user's WeChat mobile app
* User's receives order information and authorise fund transferring
* Cashier gets payment confirmation in POS

Debugging
=========

If you don't have camera, you can executing following code in browser console to simulate scanning::

    odoo.__DEBUG__.services['web.core'].bus.trigger('qr_scanned', '134579302432164181');


Roadmap
=======

* TODO: **Micropay to refund**
* TODO: Views for wechat.order
* TODO: In sake of UX, we need to add ``micropay_id`` reference to ``account.bank.statement.line``
* TODO: in demo installation, Journals are created via ``xml``, which breaks
  normal flow and for example Cash Journal is not created automatically. Those
  journals have to be created on first session opening

Credits
=======

Contributors
------------
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support you are kindly requested to purchase the module at `odoo apps store <https://apps.odoo.com/apps/modules/11.0/pos_payment_wechat/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos_addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_payment_wechat/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
