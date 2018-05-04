/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_order_print_check.chrome', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');
    var core = require('web.core');
    var _t = core._t;


    chrome.Chrome.include({
        init: function() {
            this.widgets.unshift({
                'name':   'order_print_qty',
                'widget': chrome.OrderPrintQtyWidget,
                'append':  '.pos-rightheader',
                'condition': function(){ return this.pos.config.use_proxy; },
            })
            this._super();
        },
    });

    chrome.OrderPrintQtyWidget = chrome.StatusWidget.extend({
        template: 'OrderPrintQtyWidget',
        init: function(parent,options){
            this._super(parent,options);
            var self = this;
            this.order_print_quantity = 0;
            this.show_warning_message = true;
            this.pos.on('change:qty_print_orders', function(){
                self.change_quantity_print_orders();
            });
        },
        change_quantity_print_orders: function() {
            var sum = 0;
            this.pos.printers.forEach(function(printer) {
                sum +=printer.receipt_queue.length
            });
            if (this.order_print_quantity !== sum) {
                this.order_print_quantity = sum;
                this.renderElement();
                // if use the pos_mobile module
                if (this.pos.is_mobile) {
                    $($('.pos-rightheader .oe_status')[0]).css({'margin-right': '70px'});
                }
                if (this.show_warning_message ) {
                    this.pos.gui.show_popup('error',{
                        'title': _t('Warning'),
                        'body': _t('No connection to PosBox. The orders will be printed once the connection is restored'),
                    });
                    this.show_warning_message = false;
                }
                if (this.order_print_quantity === 0) {
                    this.show_warning_message = true;
                    $(window).off('beforeunload', this.unload);
                } else {
                    this.unloader();
                }
            }
        },
        unloader: function(){
            var self = this;
            $(window).on('beforeunload', self.unload);
            $('a').on('click', function(){
                self.resetUnload();
            });
            $(document).on('submit', 'form', function(){o.resetUnload});
            $(document).on('keydown', function(event){
                if((event.ctrlKey && event.keyCode == 116) || event.keyCode == 116){
                    self.resetUnload();
                }
            });
        },
        unload: function(evt){
            var message = _t("The changes you have made will not be saved.");
            if (typeof evt == "undefined") {
                evt = window.event;
            }
            if (evt) {
                evt.returnValue = message;
            }
            return message;
        },
        resetUnload: function() {
            var self = this;
            $(window).off('beforeunload', self.unload);
            setTimeout(function(){
                $(window).on('beforeunload', self.unload);
            }, 2000);
        }
    });

    return chrome;
});
