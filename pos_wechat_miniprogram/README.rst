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

Credits
=======

Contributors
------------
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__

Sponsors
--------
* `Sinomate <http://sinomate.net/>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support you are kindly requested to purchase the module at `odoo apps store <https://apps.odoo.com/apps/modules/11.0/pos_wechat_miniprogram/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos_addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_wechat_miniprogram/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
