/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
   License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_qr_scan', function(require){
    var exports = {};

    var core = require('web.core');
    var models = require('point_of_sale.models');
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
            this.gUM = false;
            this._super(options);
            this.generate_qr_scanner();
        },
        click_cancel: function() {
            this.stop_camera();
            this._super(arguments);
        },
        stop_camera: function(camera){
            this.cam_is_on = false;
            if (this.stream){
                this.stream.getTracks()[0].stop();
            }
        },
        add_button: function(content) {
            var button = document.createElement('div');
            button.className = 'button qr-content';
            button.innerHTML = content.name;
            button.setAttribute('camera-id', content.id);
            button = $('.transparent_sidebar > .body').append(button);
            return button;
        },
        add_button_click: function(e) {
            var button = document.createElement('div');
            active_id = e.target.getAttribute('camera-id');
            this.start_webcam({'deviceId': {'exact': active_id}});
            this.pos.db.save('active_camera_id', active_id);
            return button;
        },
        get_camera_by_id: function(id) {
            return _.find(this.video_devices, function(cam){
                return cam.deviceId === id;
            });
        },
        generate_qr_scanner: function() {
            var options = false;
            var self = this;
            this.video_element = document.getElementById("preview");
            $(this.video_element).on('click',function(){
                self.click_cancel();
            });
            if(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices){
                this.capture_timeout = 700;
                try{
                    navigator.mediaDevices.enumerateDevices().then(function(devices) {
                        self.video_devices = _.filter(devices, function(d) {
                           return d.kind === 'videoinput';
                        });
                        _.each(self.video_devices, function(device) {
                            options = options || {'deviceId': {'exact':device.deviceId}};
                            if(device.label.toLowerCase().search("back") > -1) {
                                options = {'deviceId': {'exact':device.deviceId}, 'facingMode':'environment'} ;
                                self.active_camera = device;
                            }
                            self.add_button({'name': device.label, id: device.deviceId})
                                .off()
                                .on('click', function(e){
                                    self.add_button_click(e);
                                });
                        });
                        var active_camera_id = self.pos.db.load('active_camera_id', false);
                        if(active_camera_id && self.get_camera_by_id(active_camera_id)){
                            options = {'deviceId': {'exact':active_camera_id}}
                        }
                        self.start_webcam(options);
                    });
                }
                catch(e){
                    alert(e);
                }
            }
            else{
                console.log("no navigator.mediaDevices.enumerateDevices" );
                this.start_webcam(options);
            }
        },

        read: function(result){
            // Trigger event on scanning and close camera window
            if (this.pos.debug){
                console.log('QR scanned', result);
            }
            core.bus.trigger('qr_scanned', result);
            posmodel.gui.popup_instances.qr_scan.click_cancel();
        },

        start_webcam: function(options){
            var self = this;
            this.initCanvas(800, 600);
            qrcode.callback = function(value){
                self.read(value);
            }
            if(navigator.mediaDevices.getUserMedia){
                navigator.mediaDevices.getUserMedia({video: options, audio: false}).
                    then(function(stream){
                        self.stream = stream;
                        self.success(stream);
                    }).catch(function(error){
                        self.gui.show_popup('error-traceback',{
                            'title': error.name + ' ' + error.code,
                            'body':  error.message
                        });
                    });
            // dont know for what this is needed
            } else if(navigator.getUserMedia){
                webkit = true;
                navigator.getUserMedia({video: options, audio: false}, success, error);
            } else if(navigator.webkitGetUserMedia){
                webkit = true;
                navigator.webkitGetUserMedia({video:options, audio: false}, success, error);
            }

            this.cam_is_on = true;
            setTimeout(function(){
                self.captureToCanvas();
            }, this.capture_timeout);
        },

        success: function(stream){
            var self = this;
            this.video_element.srcObject = stream;
            this.video_element.play();
            this.gUM=true;
        },
        captureToCanvas: function(){
            if(!this.cam_is_on)
                return;
            if(this.gUM){
                var self = this;
                try{
                    gCtx.drawImage(this.video_element,0,0);
                    try{
                        qrcode.decode();
                    }
                    catch(e){
                        console.log(e);
                        setTimeout(function(){
                            self.captureToCanvas();
                        }, this.capture_timeout);
                    };
                }
                catch(e){
                    console.log(e);
                    setTimeout(function(){
                        self.captureToCanvas();
                    }, this.capture_timeout);
                };
            }
        },
        initCanvas: function(w,h){
            var gCanvas = document.getElementById("qr-canvas");
            gCanvas.style.width = w + "px";
            gCanvas.style.height = h + "px";
            gCanvas.width = w;
            gCanvas.height = h;
            var gCtx = gCanvas.getContext("2d");
            gCtx.clearRect(0, 0, w, h);
        }

    });

    gui.define_popup({name:'qr_scan', widget: QrScanPopupWidget});

    // Add some helpers:
    // * No need to show Cashregister that is used by scanning QR customer's code
    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        hide_cashregister: function(journal_filter){
            var self = this;
            var journal = _.filter(this.journals, journal_filter);
            if (journal.length){
                if (journal.length > 1){
                    // TODO warning
                    console.log('error', 'More than one journal to hide is found', journal);
                }
                journal = journal[0];
            } else {
                return false;
            }
            self.cashregisters = _.filter(self.cashregisters, function(r){
                if (r.journal_id[0] === journal.id){
                    self.hidden_cashregisters.push(r);
                    return false;
                }
                return true;
            });

            return journal;
        },
    });

});
