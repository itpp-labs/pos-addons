=========================
 QR Code Scanning in POS
=========================

Scans QR codes via device's camera.

Usage
=====

To subscribe to scanning event use following code in js::

    var core = require('web.core');
    core.bus.on('qr_scanned', this, function(value){
        // your handler here
    })


Credits
=======

Contributors
------------
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `Sinomate <http://sinomate.net/>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_qr_scan/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 c7171795f891335e8a8b6d5a6b796c28cea77fea
