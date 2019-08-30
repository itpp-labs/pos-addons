/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_order_receipt_custom.screens', function(require){

    var screens = require('pos_receipt_custom_template.screens');
    var gui = require('point_of_sale.gui');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    require('pos_restaurant.printbill');
    var core = require('web.core');

    var _t = core._t;
    var QWeb = core.qweb;


    PosBaseWidget.include({
        init:function(parent,options){
            var self = this;
            this._super(parent,options);
            if (this.gui && this.gui.screen_instances.products && this.gui.screen_instances.products.action_buttons.print_bill) {
                var printbill = this.gui.screen_instances.products.action_buttons.print_bill;
                printbill.button_click = function() {
                    self.printbill_button_click();
                };
                printbill.print_xml = function () {
                    self.printbill_print_xml();
                };
            }
        },
        printbill_button_click: function(){
            if (this.pos.config.iface_print_via_proxy) {
                this.printbill_print_xml();
            } else {
                var order = this.pos.get('selectedOrder');
                order.set_receipt_type(_t('Pre-receipt'));
                this.gui.show_screen('bill');
            }
        },
        printbill_print_xml: function() {
            var order = this.pos.get_order();
            if(!order.get_orderlines().length) {
                return;
            }
            if (this.pos.config.custom_xml_receipt) {
                order.set_receipt_type(_t('Pre-receipt'));
                // for compatibility with pos_orders_history module (we don't need to print the bill with a barcode)
                var barcode_in_receipt_old_value = this.pos.config.show_barcode_in_receipt;
                if (barcode_in_receipt_old_value) {
                    this.pos.config.show_barcode_in_receipt = false;
                }
                // remove the last order barcode
                this.pos.chrome.screens.receipt.$el.find('#barcode').parent().remove();
                this.pos.chrome.screens.receipt.print_xml();
                // return config settings after print bill
                this.pos.config.show_barcode_in_receipt = barcode_in_receipt_old_value;
                order._printed = false;
            } else {
                var receipt = order.export_for_printing();
                var printbill = this.gui.screen_instances.products.action_buttons.print_bill;
                receipt.bill = true;
                this.pos.proxy.print_receipt(QWeb.render('BillReceipt',{
                    receipt: receipt, widget: printbill, pos: this.pos, order: order,
                }));
            }
            order.set_receipt_type(false);
        },
    });
});
