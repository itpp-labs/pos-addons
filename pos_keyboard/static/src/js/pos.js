function pos_keyboard_widgets(instance, module){

    module.PosWidget.include({
        start: function() {
            self = this;
            resSuper = this._super();
            res = resSuper.done(function(e){
                self.pos.keypad.connect();
                self.pos.keypad.set_action_callback(function(data){
                     self.keypad_action(data, self.pos.keypad.type);
                });
            });
            return res;
        },
        close: function() {
            this._super();
            this.pos.keypad.disconnect();
        },
        keypad_action: function(data, type){
             var numpad =  this.pos_widget.numpad;
             if (data.type === type.numchar){
                 numpad.state.appendNewChar(data.val);
             }
             else if (data.type === type.bmode) {
                 numpad.state.changeMode(data.val);
             }
             else if (data.type === type.sign){
                 numpad.clickSwitchSign();
             }
             else if (data.type === type.backspace){
                 numpad.clickDeleteLastChar();
             }
        },
    });

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize: function(session, attributes) {
            this.keypad = new module.Keypad({'pos': this});
            PosModelSuper.prototype.initialize.call(this, session, attributes);
          },
    });

    // this module mimics a keypad-only cash register. Use connect() and 
    // disconnect() to activate and deactivate it.
    module.Keypad = instance.web.Class.extend({
        init: function(attributes){
            this.pos = attributes.pos;
            this.pos_widget = this.pos.pos_widget; 
            this.type = {
                 numchar: 'number, dot',
                 bmode: 'qty, disc, price', 
                 sign: '+, -',
                 backspace: 'backspace'
            }
            this.data = {
                type: undefined,
                val: undefined
            }
            this.action_callback = undefined;
        },

        save_callback: function(){
            this.saved_callback_stack.push(this.action_callback);
        },

        restore_callback: function(){
            if (this.saved_callback_stack.length > 0) {
                this.action_callback = this.saved_callback_stack.pop();
            }
        },

        set_action_callback: function(callback){
            this.action_callback = callback
        },

        //remove action callback
        reset_action_callback: function(){
            this.action_callback = undefined;
        },
        
        // starts catching keyboard events and tries to interpret keystrokes,
        // calling the callback when needed.
        connect: function(){
            var self = this;
            // --- additional keyboard ---//
            var KC_PLU = 107;      // KeyCode: + or - (Keypad '+')
            var KC_QTY = 111;      // KeyCode: Quantity (Keypad '/')
            var KC_AMT = 106;      // KeyCode: Price (Keypad '*')
            var KC_DISC = 109;     // KeyCode: Discount Percentage [0..100] (Keypad '-')
            // --- basic keyboard --- //
            var KC_PLU_1 = 83;    // KeyCode: sign + or - (Keypad 's')
            var KC_QTY_1 = 81;     // KeyCode: Quantity (Keypad 'q')
            var KC_AMT_1 = 80;     // KeyCode: Price (Keypad 'p')
            var KC_DISC_1 = 68;    // KeyCode: Discount Percentage [0..100] (Keypad 'd')

            var KC_BACKSPACE = 8;  // KeyCode: Backspace (Keypad 'backspace')       
            var kc_lookup = {
                48: '0', 49: '1', 50: '2',  51: '3', 52: '4',
                53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
                80: 'p', 83: 's', 68: 'd', 190: '.', 81: 'q',
                96: '0', 97: '1', 98: '2',  99: '3', 100: '4',
                101: '5', 102: '6', 103: '7', 104: '8', 105: '9',
                106: '*', 107: '+', 109: '-', 110: '.', 111: '/',
            };

            //cancel return to the previous page when press backspace
            var rx = /INPUT|SELECT|TEXTAREA/i;
            $(document).on("keydown keypress", function(e){
                if( e.which == 8 ){ // 8 == backspace
                    if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                        e.preventDefault();
                    }
                }
            });

            //usb keyboard keyup event
            var ok = false;
            var timeStamp = 0;
            $('body').on('keyup', '', function (e){
                var statusHandler  =  !rx.test(e.target.tagName)  ||
                    e.target.disabled || e.target.readOnly;
                if (statusHandler){
                    var is_number = false;
                    var type = self.type;
                    var buttonMode = {
                        qty: 'quantity',
                        disc: 'discount',
                        price: 'price'
                    };
                    var token = e.keyCode;
                    if ((token >= 96 && token <= 105 || token == 110) ||
                        (token >= 48 && token <= 57 || token == 190)) {
                            self.data.type = type.numchar;
                            self.data.val = kc_lookup[token];
                            is_number = true;
                            ok = true;
                    } 
                    else if (token == KC_PLU || token == KC_PLU_1) {
                        self.data.type = type.sign;
                        ok = true;
                    } 
                    else if (token == KC_QTY || token == KC_QTY_1) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.qty;
                        ok = true;
                    } 
                    else if (token == KC_AMT || token == KC_AMT_1) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.price;
                        ok = true;
                    } 
                    else if (token == KC_DISC || token == KC_DISC_1) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.disc;
                        ok = true;
                    } 
                    else if (token == KC_BACKSPACE) {
                        self.data.type = type.backspace;
                        ok = true;
                    } 
                    else {
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

                    setTimeout(function(){
                        if (ok) {self.action_callback(self.data);}
                    }, 50);
                }
            });
        },

        // stops catching keyboard events 
        disconnect: function(){
            $('body').off('keyup', '')
        }
    });
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        pos_keyboard_widgets(instance, module);
    }
})();