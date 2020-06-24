.. image:: https://img.shields.io/badge/license-MIT-blue.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License: MIT

=======================
 Tencent Cloud SMS API
=======================

Basic tools to integrate Odoo and Tencent Cloud SMS.

.. contents::
   :local:

Tencent SMS service
===================

Tencent Cloud SMS currently supports the following operations:

Domestic SMS
------------

* Single text message
* Specify a template to send a text message
* Send group/mass message
* Specify template to send group/mass text messages
* Pull SMS receipt and SMS reply status

> `Note` SMS pull function need to contact tencent cloud SMS technical support (QQ:3012203387)opened permissions, large customers can use this feature batch pull, other customers do not recommend using.

International SMS
-----------------

* Single text message
* Specify a template to send a text message
* Send group/mass message
* Specify template to send group/mass text messages
* Pull SMS receipt and SMS reply status

> `Note` Overseas SMS and domestic SMS use the same interface, just replace the corresponding country code and mobile phone number. Each time you request the mobile phone number from the group sending interface, all mobile phone numbers must be domestic or international only

Voice Notification
------------------

* Send a voice verification code
* Send a voice announcement
* Upload a voice file
* Send a voice announcement by voice file fid
* Specify a template to send a voice notification class

Developing preparation
======================

Get SDK AppID and AppKey
------------------------

Cloud SMS app SDK 'AppID' and 'AppKey' are available in `SMS console <https://console.cloud.tencent.com/sms>`__

Application signature
---------------------

A complete SMS consists of two parts: SMS `signature` and SMS text. The SMS `signature` must be applied and reviewed in the corresponding service module of the `SMS console <https://console.cloud.tencent.com/sms>`__.

Application template
--------------------

The template for text or voice message must be applied and reviewed in the corresponding service module of the `SMS console <https://console.cloud.tencent.com/sms>`__

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


Further information
===================

Demo: http://runbot.it-projects.info/demo/misc-addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/wechat/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
