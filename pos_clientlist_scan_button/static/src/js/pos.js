/*  Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_clientlist_scan_button.pos', function (require) {
    "use strict";

    var screens = require('point_of_sale.screens');

    screens.ClientListScreenWidget.include({

        display_client_details: function(visibility, partner, clickpos){
            var self = this;
            this._super(visibility, partner, clickpos);
            var $buttons = this.$el.find('.button.scan').off();
            if(visibility === 'edit'){
                $buttons.on('click', function(ev) {
                    var field = this.attributes.data.value;
                    self.gui.show_popup('qr_scan', {
                        read_callback: self.scan_callback,
                        field: field,
                        ClientListScreenWidget: self
                    });
                });
            }
        },

        scan_callback: function(value, method) {
            if (this.pos.debug){
                console.log(method.toUpperCase() + ' scanned', value);
            }
            var $input = this.options.ClientListScreenWidget.$el.find('input.' + this.options.field);
            if ($input) {
                $input.val(value);
            }
            this.click_cancel();
        },
    });

});
