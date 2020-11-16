.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

.. image:: https://img.shields.io/badge/license-MIT-blue.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License: MIT

==========================
 POS: WeChat Mini-program
==========================

Integrate POS with WeChat mini-program

Verification mobile number
==========================

Use the mobile phone number specified in your WeChat account.::

    authByWeChat: function (e) {
        var detail = e.detail;
        var params = {
            model: 'res.users',
            method: 'wechat_mobile_number_verification',
            args: [detail],
            context: {},
            kwargs: {}
        };
        odooRpc(params).then(function (res) {
            wx.setStorageSync('telephoneNumberVerified', res.result);
        })
    }

Payments
========

Pay via WeChat mini-program
---------------------------

TODO

Pay via POS
-----------

TODO

Roadmap
=======

* TODO: need to do something with warnings like this: ``pos.miniprogram.order.line.create() includes unknown fields: category, description``
* TODO: uncomment test_create_without_pay_from_miniprogram_ui and make it work. It fails for some reason.

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__

===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/11.0/pos_wechat_miniprogram/


Tested on `Odoo 11.0 <https://github.com/odoo/odoo/commit/ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06>`_
