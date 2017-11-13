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
            this.start_script();
        },
        click_cancel: function(){
            this.var_scanner.stop();
            this._super(arguments);
        },
        start_script: function() {
            this.var_scanner = new Instascan.Scanner({video: document.getElementById('preview')});
            var scanner = this.var_scanner;
            scanner.addListener('scan', function (content) {
                console.log(content);
                var new_scan = document.createElement('a');
                new_scan.setAttribute("href", content);
                var par = document.createElement("p");
                par.innerHTML = content;
                new_scan.appendChild(par);
                $('.sidebar > .body').append(new_scan);
                scanner.stop()
            });
            Instascan.Camera.getCameras().then(function (cameras) {
                if (cameras.length > 0) {
                    scanner.start(cameras[0]);
                } else {
                    console.error('No cameras found.');
                }
            }).catch(function (e) {
                console.error(e);
            });
        },
    });
    gui.define_popup({name:'qr_scan', widget: QrScanPopupWidget});
});
