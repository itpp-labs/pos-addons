/* Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_rfid', function(require){
    var BarcodeReader = require('point_of_sale.devices').BarcodeReader;
    var ScreenWidget = require('point_of_sale.screens').ScreenWidget;

    BarcodeReader.include({
        scan: function(code){
            try{
                // hex to dec
                this.pos.ignored_barcode_errors = 0;
                unhexed_code = parseInt(code, 16).toString();
                if (unhexed_code.length % 2) {
                    unhexed_code = '0' + unhexed_code;
                }
                this._super(unhexed_code);
            } catch (error) {
                this.pos.ignored_barcode_errors += 1;
            }
            if (!this.pos.ignored_barcode_errors){
                // no errors means that fixed barcode was handled
                return;
            }
            this.pos.ignored_barcode_errors = null;
            this._super(code);
        },
    });

    ScreenWidget.include({
        barcode_error_action: function() {
            if (this.pos.ignored_barcode_errors === null)
                this._super.apply(this, arguments);
            else
                this.pos.ignored_barcode_errors += 1;

        }
    });

});
