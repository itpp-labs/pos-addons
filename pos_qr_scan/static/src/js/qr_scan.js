odoo.define('pos_qr_scan', function(require){
    var exports = {};

    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens');
    var QrButton = screens.QrButton = {};

    var QrButton = screens.ActionButtonWidget.extend({
        template: 'QrButton',
        button_click: function(){
            var self = this;
            this.gui.show_popup('qr_scan',{
                'title': 'QR Scanning',
                'value': this.pos.config.discount_pc,
                'confirm': function() {
                },
            });
        },
    });

    screens.define_action_button({
        'name': 'qr_button',
        'widget': QrButton,
        'condition': function(){
            return this.pos.config;
        },
    });

    var QrScanPopupWidget = PopupWidget.extend({
        template: 'QrScanPopupWidget',
        show: function (options) {
            var self = this;
            this._super(options);
        },
    });
    gui.define_popup({name:'qr_scan', widget: QrScanPopupWidget});
});
