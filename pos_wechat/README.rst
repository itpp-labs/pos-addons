========================
 WeChat Payments in POS
========================

The module implements following payment workflows

Quick Pay (micropay)
--------------------

* Cashier creates order and scan user's QR in user's WeChat mobile app

  * scanning can be done via Mobile Phone camera (``pos_mobile`` module is recommended)
  * scanning can be done via usb scanner
  * scanning can be done via usb scanner attached to PosBox

* User's receives order information and authorise fund transferring
* Cashier gets payment confirmation in POS

Native Payment (QR Code Payment)
--------------------------------

* Cashier clicks a button to  get one-time url and shows it to Buyer as a QR Code

  * QR can be shown in POS
  * QR can be shown in Mobile POS (``pos_mobile`` module is recommended)
  * QR can be shown in Customer screen

* Buyer scans to finish the transaction.
* Cashier gets payment confirmation in POS

Debugging
=========

Camera
------

If you don't have camera, you can executing following code in browser console to simulate scanning::

    odoo.__DEBUG__.services['web.core'].bus.trigger('qr_scanned', '134579302432164181');

Customer Screen
---------------

To emulate Customer screen do as following:

* run another odoo on a different port, say ``9069``, workers 1,  extra *server wide modules*, i.e. use ``--workers=1 --load=web,hw_proxy,hw_posbox_homepage,hw_screen``
* open page at your browser: http://localhost:9069/point_of_sale/display -- you must see message ``POSBox Client display``
* at POS' Settings activate ``[x] PosBox``, activate ``[x] Customer Display`` and set **IP Address** to ``localhost:9069``
* Now just open POS

Roadmap
=======

* TODO: In sake of UX, we need to add ``micropay_id`` reference to ``account.bank.statement.line``

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `Sinomate <http://sinomate.net/>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support you are kindly requested to purchase the module at `odoo apps store <https://apps.odoo.com/apps/modules/11.0/pos_payment_wechat/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos_addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_wechat/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos-addons/commits/11.0/pos_wechat.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos-addons/commits/11.0/pos_wechat.atom>`_


Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
