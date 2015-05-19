function pos_keyboard_widgets(instance, module){

    module.PosWidget.include({
        start: function() {
            self = this;
            res = this._super();
            res.done(function(e){
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
             if (data.type === type.bmode) {
                 numpad.state.changeMode(data.val);
             }
             else if (data.type === type.sign){
                 numpad.clickSwitchSign();
             }
             else if (data.type === type.numchar){
                 numpad.state.appendNewChar(data.val);
             }
             else if (data.type === type.backspace){
                 numpad.clickDeleteLastChar();
             }
        },
    });

    module.NumpadWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.modeButton = {
                qty: 'quantity',
                disc: 'discount',
                price: 'price' 
            } 
        }
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
            var KC_PLU = 107;      // KeyCode: Product Code (Keypad '+')
            var KC_QTY = 111;      // KeyCode: Quantity (Keypad '/')
            var KC_AMT = 106;      // KeyCode: Price (Keypad '*')
            var KC_DISC = 109;     // KeyCode: Discount Percentage [0..100] (Keypad '-')
            var KC_BACKSPACE = 8;  // KeyCode: Backspace (Keypad 'backspace')      
            var kc_lookup = {
                96: '0', 97: '1', 98: '2',  99: '3', 100: '4',
                101: '5', 102: '6', 103: '7', 104: '8', 105: '9',
                106: '*', 107: '+', 109: '-', 110: '.', 111: '/',
            };

            //cancel return to the previous page when press backspace
            var rx = /INPUT|SELECT|TEXTAREA/i;
            $(document).bind("keydown keypress", function(e){
                if( e.which == 8 ){ // 8 == backspace
                    if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                        e.preventDefault();
                    }
                }
            });

            //usb keyboard keyup event
            $('body').delegate('','keyup', function (e){
                var type = self.type;
                var buttonMode = self.pos.pos_widget.numpad.modeButton
                token = e.keyCode;                
                if ((token >= 96 && token <= 111) || token === KC_PLU  || token === KC_QTY || token === KC_AMT) {

                    if (token === KC_PLU) {
                        self.data.type = type.sign;
                    } else if (token === KC_QTY) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.qty
                    } else if (token === KC_AMT) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.price;
                    } else if (token === KC_DISC) {
                        self.data.type = type.bmode;
                        self.data.val = buttonMode.disc;
                    } else {
                        self.data.type = type.numchar;
                        self.data.val = kc_lookup[token];
                    }
                    
                    self.action_callback(self.data);

                } else if (token === KC_BACKSPACE && !rx.test(e.target.tagName)) {
                    self.data.type = type.backspace;
                    self.action_callback(self.data);
                }
            });
        },

        // stops catching keyboard events 
        disconnect: function(){
            $('body').undelegate('', 'keyup')
        },
    });
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        pos_keyboard_widgets(instance, module);
    }
})()
