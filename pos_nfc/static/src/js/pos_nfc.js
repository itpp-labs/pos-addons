/* Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_nfc", function(require) {
    "use strict";
    var BarcodeReader = require("point_of_sale.devices").BarcodeReader;

    BarcodeReader.include({
        init: function(attributes) {
            this._super(attributes);
            $(_.bind(this.start_nfc, this, false));
        },
        start_nfc: function() {
            if ("nfc" in navigator) {
                navigator.nfc
                    .watch(
                        _.bind(function(message) {
                            if (this.pos.debug) {
                                console.log("NFC scanning:", JSON.stringify(message));
                            }
                            _.each(
                                message.records,
                                function(r) {
                                    if (r.recordType === "text") {
                                        this.scan(r.data);
                                    }
                                },
                                this
                            );
                        }, this),
                        {mode: "any"}
                    )
                    .catch(err => console.log("Adding NFC watch failed: " + err.name));
            } else {
                console.log("NFC API is not supported.");
            }
        },
    });
});
