/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_order_print_check.devices', function (require) {
    "use strict";

    var devices = require('point_of_sale.devices');

    devices.ProxyDevice.include({
        init: function(parent,options) {
            this._super(parent,options);
            this.on('change:status',this,function(eh,status) {
                this.pos.trigger('change:qty_print_orders');
                status = status.newValue;
                if(status.status === 'connected' && status.status !== this.old_status) {
                    // if connection to PosBox is restored, send all orders to print
                    this.pos.printers.forEach(function(printer) {
                        if (printer.receipt_queue.length) {
                            printer.print();
                        }
                    });
                }
                this.old_status = status.status;
            });
        }
    });
    return devices;
});
