.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

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

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/13.0/pos_wechat/


Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos-addons/commits/13.0/pos_wechat.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos-addons/commits/13.0/pos_wechat.atom>`_

Tested on `Odoo 12.0 <https://github.com/odoo/odoo/commit/b05e34a0d9b13a1c6971b99ed3e5fa20199f3545>`_
