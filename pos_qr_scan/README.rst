.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

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


Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__


Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/13.0/pos_qr_scan/


Tested on `Odoo 11.0 <https://github.com/odoo/odoo/commit/c7171795f891335e8a8b6d5a6b796c28cea77fea>`_
