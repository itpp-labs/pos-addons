=========================
 POS QR/Barcode Scanning
=========================

Scans QR codes and barcodes via device's camera.

the module supports next barcode codings:

* code 128
* ean
* ean 8
* code 39
* code 39 vin
* codabar
* upc
* upc e
* i2of5
* code 93

Usage
=====

To subscribe to qr scanning event use following code in js::

    var core = require('web.core');
    core.bus.on('qr_scanned', this, function(value){
        // your handler here
    });

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

Demo: http://runbot.it-projects.info/demo/pos-addons/12.0

HTML Description: https://apps.odoo.com/apps/modules/12.0/pos_qr_scan/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 12.0 53dcdd5a9e22429a9638f68674264436ce21e42b
