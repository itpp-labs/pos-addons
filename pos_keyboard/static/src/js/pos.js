/*  Copyright 2015 igallyamov <https://github.com/igallyamov>
    Copyright 2016 ufaks <https://github.com/ufaks>
    Copyright 2016 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/kolushovalexandr>
    Copyright 2019 ssaid <https://github.com/ssaid>
    Copyright 2019 raulovallet <https://github.com/raulovallet>
    License MIT (https://opensource.org/licenses/MIT). */
/* eslint complexity: "off"*/
odoo.define("pos_keyboard.pos", function(require) {
    "use strict";

    var core = require("web.core");
    var gui = require("point_of_sale.gui");
    var models = require("point_of_sale.models");
    var screens = require("point_of_sale.screens");
    var PopupWidget = require("point_of_sale.popups");

    // This module mimics a keypad-only cash register. Use connect() and
    // disconnect() to activate and deactivate it.
    var Keypad = core.Class.extend({
        init: function(attributes) {
            this.pos = attributes.pos;
            /* This.pos_widget = this.pos.pos_widget;*/
            this.type = {
                numchar: "number, dot",
                bmode: "quantity, discount, price",
                sign: "+, -",
                backspace: "backspace",
                enter: "enter",
                escape: "escape",
            };
            this.data = {
                type: undefined,
                val: undefined,
            };
            this.action_callback = undefined;
            this.active = false;
        },

        save_callback: function() {
            this.saved_callback_stack.push(this.action_callback);
        },

        restore_callback: function() {
            if (this.saved_callback_stack.length > 0) {
                this.action_callback = this.saved_callback_stack.pop();
            }
        },

        set_action_callback: function(callback) {
            this.action_callback = callback;
        },

        // Remove action callback
        reset_action_callback: function() {
            this.action_callback = undefined;
        },

        // Starts catching keyboard events and tries to interpret keystrokes,
        // calling the callback when needed.
        connect: function() {
            var self = this;
            if (self.active) {
                return;
            }
            // --- additional keyboard ---//
            // KeyCode: + or - (Keypad '+')
            var KC_PLU = 107;
            // KeyCode: Quantity (Keypad '/')
            var KC_QTY = 111;
            // KeyCode: Price (Keypad '*')
            var KC_AMT = 106;
            // KeyCode: Discount Percentage [0..100] (Keypad '-')
            var KC_DISC = 109;
            // --- basic keyboard --- //
            // KeyCode: sign + or - (Keypad 's')
            var KC_PLU_1 = 83;
            // KeyCode: Quantity (Keypad 'q')
            var KC_QTY_1 = 81;
            // KeyCode: Price (Keypad 'p')
            var KC_AMT_1 = 80;
            // KeyCode: Discount Percentage [0..100] (Keypad 'd')
            var KC_DISC_1 = 68;

            // KeyCode: Backspace (Keypad 'backspace')
            var KC_BACKSPACE = 8;
            // KeyCode: Enter (Keypad 'enter')
            var KC_ENTER = 13;
            // KeyCode: Escape (Keypad 'esc')
            var KC_ESCAPE = 27;
            var kc_lookup = {
                48: "0",
                49: "1",
                50: "2",
                51: "3",
                52: "4",
                53: "5",
                54: "6",
                55: "7",
                56: "8",
                57: "9",
                80: "p",
                83: "s",
                68: "d",
                190: ".",
                81: "q",
                96: "0",
                97: "1",
                98: "2",
                99: "3",
                100: "4",
                101: "5",
                102: "6",
                103: "7",
                104: "8",
                105: "9",
                106: "*",
                107: "+",
                109: "-",
                110: ".",
                111: "/",
            };

            // Usb keyboard keyup event
            var rx = /INPUT|SELECT|TEXTAREA/i;
            var ok = false;
            var timeStamp = 0;
            $("body").on("keyup", "", function(e) {
                var statusHandler =
                    !rx.test(e.target.tagName) ||
                    e.target.disabled ||
                    e.target.readOnly;
                // TODO: simplify that stuff/ it might be needed only for password pop-up
                if (statusHandler) {
                    var is_number = false;
                    var type = self.type;
                    var buttonMode = {
                        qty: "quantity",
                        disc: "discount",
                        price: "price",
                    };
                    var token = e.keyCode;
                    if (
                        (token >= 96 && token <= 105) ||
                        token === 110 ||
                        (token >= 48 && token <= 57) ||
                        token === 190
                    ) {
                        self.data.type = type.numchar;
                        self.data.val = kc_lookup[token];
                        is_number = true;
                        ok = true;
                    } else if (token === KC_PLU || token === KC_PLU_1) {
                        self.data.type = type.sign;
                        ok = true;
                    } else if (token === KC_QTY || token === KC_QTY_1) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.qty;
                        ok = true;
                    } else if (token === KC_AMT || token === KC_AMT_1) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.price;
                        ok = true;
                    } else if (token === KC_DISC || token === KC_DISC_1) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.disc;
                        ok = true;
                    } else if (token === KC_BACKSPACE) {
                        self.data.type = type.backspace;
                        ok = true;
                    } else if (token === KC_ENTER) {
                        self.data.type = type.enter;
                        ok = true;
                    } else if (token === KC_ESCAPE) {
                        self.data.type = type.escape;
                        ok = true;
                    } else {
                        self.data.type = undefined;
                        self.data.val = undefined;
                        ok = false;
                    }

                    if (is_number) {
                        if (timeStamp + 50 > new Date().getTime()) {
                            ok = false;
                        }
                    }

                    timeStamp = new Date().getTime();

                    setTimeout(function() {
                        if (ok) {
                            self.action_callback(self.data);
                        }
                    }, 50);
                }
            });
            self.active = true;
        },

        // Stops catching keyboard events
        disconnect: function() {
            $("body").off("keyup", "");
            this.active = false;
        },
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
            var self = this;
            this.keypad = new Keypad({pos: this});
            _super_posmodel.initialize.call(this, session, attributes);
            this.ready.then(function() {
                self.keypad.set_action_callback(function(data) {
                    var current_popup = self.gui.current_popup;
                    if (current_popup) {
                        current_popup.keypad_action(data);
                    }
                });
            });
        },
    });

    gui.Gui.include({
        show_popup: function(name, options) {
            this._super(name, options);
            this.remove_keyboard_handler();
            this.pos.keypad.connect();
        },

        close_popup: function() {
            this._super();
            this.add_keyboard_handler();
            this.pos.keypad.disconnect();
        },

        add_keyboard_handler: function() {
            var current_screen = this.current_screen;
            if (!current_screen) {
                return;
            }
            if (current_screen.keyboard_handler) {
                // PaymentScreen
                $("body").keypress(current_screen.keyboard_handler);
                $("body").keydown(current_screen.keyboard_keydown_handler);
            }
            if (current_screen._onKeypadKeyDown) {
                // ProductScreen
                $(document).on(
                    "keydown.productscreen",
                    this.screen_instances.products._onKeypadKeyDown
                );
            }
        },

        remove_keyboard_handler: function() {
            var current_screen = this.current_screen;
            if (!current_screen) {
                return;
            }
            if (current_screen.keyboard_handler) {
                // PaymentScreen
                $("body").off("keypress", current_screen.keyboard_handler);
                $("body").off("keydown", current_screen.keyboard_keydown_handler);
            }
            if (current_screen._onKeypadKeyDown) {
                // ProductScreen
                $(document).off(
                    "keydown.productscreen",
                    current_screen._onKeypadKeyDown
                );
            }
        },
    });

    // It's added to show '*' in password pop-up
    gui.Gui.prototype.popup_classes
        .filter(function(c) {
            return c.name === "password";
        })[0]
        .widget.include({
            init: function(parent, args) {
                this._super(parent, args);
                this.popup_type = "password";
            },
        });

    PopupWidget.include({
        keypad_action: function(data) {
            var type = this.pos.keypad.type;
            if (data.type === type.numchar) {
                this.click_keyboard(data.val);
            } else if (data.type === type.backspace) {
                this.click_keyboard("BACKSPACE");
            } else if (data.type === type.enter) {
                // Some pop-ups might throw an error due to lack of some income data
                try {
                    return this.click_confirm();
                } catch (error) {
                    return;
                }
            } else if (data.type === type.escape) {
                this.click_cancel();
            }
        },
        click_keyboard: function(value) {
            if (typeof this.inputbuffer === "undefined") {
                return;
            }
            var newbuf = this.gui.numpad_input(this.inputbuffer, value, {
                firstinput: this.firstinput,
            });

            this.firstinput = newbuf.length === 0;

            var $value = this.$(".value");
            if (newbuf !== this.inputbuffer) {
                this.inputbuffer = newbuf;
                $value.text(this.inputbuffer);
            }
            if (this.popup_type === "password" && newbuf) {
                $value.text($value.text().replace(/./g, "•"));
            }
        },
        show: function(options) {
            this._super(options);
            this.$("input,textarea").focus();
        },
    });

    screens.ProductScreenWidget.include({
        _handleBufferedKeys: function() {
            // If more than 2 keys are recorded in the buffer, chances are high that the input comes
            // from a barcode scanner. In this case, we don't do anything.
            if (this.buffered_key_events.length > 2) {
                this.buffered_key_events = [];
                return;
            }

            for (var i = 0; i < this.buffered_key_events.length; ++i) {
                var ev = this.buffered_key_events[i];

                switch (ev.key) {
                    case "q":
                        this.numpad.state.changeMode("quantity");
                        break;
                    case "d":
                        this.numpad.state.changeMode("discount");
                        break;
                    case "p":
                        this.numpad.state.changeMode("price");
                        break;
                }
            }
            this._super();
        },
    });

    return {
        Keypad: Keypad,
    };
});
