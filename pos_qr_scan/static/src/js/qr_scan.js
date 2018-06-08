odoo.define('pos_qr_scan', function(require){
    var exports = {};

    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens');

    var QrButton = screens.ActionButtonWidget.extend({
        template: 'QrButton',
        button_click: function(){
            var self = this;
            this.gui.show_popup('qr_scan',{
                'title': 'QR Scanning',
                'value': false,
            });
        },
    });

    screens.define_action_button({
        'name': 'qr_button',
        'widget': QrButton,
    });

    var QrScanPopupWidget = PopupWidget.extend({
        template: 'QrScanPopupWidget',
        show: function (options) {
            var self = this;
            this._super(options);
            this.generate_qr_scanner();
        },
        click_cancel: function() {
            this.var_scanner.stop();
            this._super(arguments);
        },
        click_confirm: function() {
            this.var_scanner.stop();
            this._super(arguments);
        },
        add_button: function(content) {
            var new_scan = document.createElement('div');
            new_scan.className = 'button qr-content'
            new_scan.innerHTML = content;
            return $('.transparent_sidebar > .body').append(new_scan);
        },
        generate_qr_scanner: function() {
            var self = this;
            this.var_scanner = new Instascan.Scanner({video: document.getElementById('preview')});
            var scanner = this.var_scanner;
            var qr_scan_popup = this.pos.gui.popup_instances.qr_scan;
            if (this.pos.get_order().auth_code) {
                var old_content = this.pos.get_order().auth_code;
                qr_scan_popup.add_button(old_content);
            }
            $('.popup.popup-qr_scan .preview-container').on('click',function(){
                qr_scan_popup.click_cancel();
            });
            scanner.addListener('scan', function (content) {
                console.log(content);
                qr_scan_popup.add_button(content);
                self.pos.get_order().auth_code = content;
                console.log(content);
            });
            Instascan.Camera.getCameras().then(function (cameras) {
                if (cameras.length > 0) {
                    scanner.start(cameras[0]);
                    for (var i = 0; i < cameras.length; i++) {
                        self.add_button(cameras[i].name).off().on('click',function(){
                            self.var_scanner.stop();
                            scanner.start(cameras[i]);
                        });
                    };
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
