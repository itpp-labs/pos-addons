/* global qrcode, _ */
odoo.define("pos_qr_scan.QRScanPopup", function (require) {
    "use strict";

    const core = require("web.core");
    const {useState, useRef} = owl.hooks;
    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");

    class QRScanPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.state = useState({
                loading: true,
                active_camera: null,
            });
            this.videoElement = useRef("preview");
            this.canvas = useRef("canvas");
            this.captureTimeout = 700;
            this.cam_is_on = false;
            this.video_devices_by_id = {};
        }

        get isBrowserSupported() {
            return (
                navigator.mediaDevices &&
                navigator.mediaDevices.enumerateDevices &&
                navigator.mediaDevices.getUserMedia
            );
        }

        get videoDevices() {
            return _.values(this.video_devices_by_id);
        }

        onClickCancel(event) {
            this.cancel();
        }

        cancel() {
            this.stopCamera();
            return super.cancel.apply(this, arguments);
        }

        onClickCameraButton(event) {
            const deviceId = $(event.target).data("camera-id");
            this.startWebCam(deviceId);
            this.env.pos.db.save("active_camera_id", deviceId);
        }

        stopCamera() {
            this.state.active_camera = false;
            if (this.stream) {
                this.stream.getTracks()[0].stop();
            }
        }

        mounted() {
            if (!this.isBrowserSupported) return;
            this.state.loading = true;

            navigator.mediaDevices
                .getUserMedia({audio: false, video: true})
                .then(() => {
                    return navigator.mediaDevices.enumerateDevices();
                })
                .then((devices) => {
                    const video_devices = _.filter(
                        devices,
                        (d) => d.kind === "videoinput"
                    );
                    let deviceId = false;
                    let facingMode = false;

                    if (video_devices.some((device) => !device.deviceId)) {
                        this.showPopup("ErrorPopup", {
                            body:
                                "Browser returns devices empty device IDs. Perhaps you need to use https connection?",
                        });
                        return;
                    }

                    this.video_devices_by_id = _.indexBy(video_devices, "deviceId");

                    _.each(this.video_devices_by_id, (device) => {
                        deviceId = deviceId || device.deviceId;
                        if (device.label.toLowerCase().search("back") > -1) {
                            deviceId = device.deviceId;
                            facingMode = "environment";
                        }
                    });

                    const active_camera_id = this.env.pos.db.load(
                        "active_camera_id",
                        false
                    );
                    if (
                        active_camera_id &&
                        this.video_devices_by_id[active_camera_id]
                    ) {
                        deviceId = active_camera_id;
                        facingMode = false;
                    }
                    this.startWebCam(deviceId, facingMode);
                })
                .catch((error) => {
                    console.error(error);
                    this.showPopup("ErrorPopup", {
                        body: error.message,
                    });
                });
        }

        read(result) {
            if (this.env.pos.debug) {
                console.log("QR scanned", result);
            }
            core.bus.trigger("qr_scanned", result);
            this.onClickCancel();
        }

        startWebCam(deviceId, facingMode) {
            const options = {deviceId: {exact: deviceId}, facingMode: facingMode};
            this.state.loading = false;
            this.state.active_camera = deviceId;
            this.initCanvas(800, 600);
            qrcode.callback = (value) => this.read(value);
            navigator.mediaDevices
                .getUserMedia({video: options, audio: false})
                .then((stream) => {
                    this.stream = stream;
                    this.success(stream);
                })
                .catch((error) => {
                    this.showPopup("ErrorTracebackPopup", {
                        title: error.name + " " + error.code,
                        body: error.message,
                    });
                });

            setTimeout(() => this.captureToCanvas(), this.captureTimeout);
        }

        success(stream) {
            this.videoElement.el.srcObject = stream;
            this.videoElement.el.play();
        }

        captureToCanvas() {
            if (!this.state.active_camera) return;

            try {
                this.gCtx.drawImage(this.videoElement.el, 0, 0);
                try {
                    qrcode.decode();
                } catch (e) {
                    console.log(e);
                    setTimeout(() => this.captureToCanvas(), this.captureTimeout);
                }
            } catch (e) {
                console.log(e);
                setTimeout(() => this.captureToCanvas(), this.captureTimeout);
            }
        }

        initCanvas(w, h) {
            const gCanvas = this.canvas.el;
            gCanvas.style.width = w + "px";
            gCanvas.style.height = h + "px";
            gCanvas.width = w;
            gCanvas.height = h;
            const gCtx = gCanvas.getContext("2d");
            gCtx.clearRect(0, 0, w, h);
            this.gCtx = gCtx;
        }
    }
    QRScanPopup.template = "QRScanPopup";

    Registries.Component.add(QRScanPopup);

    return QRScanPopup;
});
