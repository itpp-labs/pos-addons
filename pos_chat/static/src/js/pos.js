odoo.define('pos_popup_button', function (require){
  'use_strict';

  var screens = require('point_of_sale.screens');
  var gui = require('point_of_sale.gui');

var PopupWidget = require('point_of_sale.popups');

var QrScanPopupWidget = PopupWidget.extend({
    // It requires the template attribute with a Qweb template name for showing pop-up
    template: 'QrScanPopupWidget',
        button_click: function(){
            var self = this;
            this.gui.show_popup('qr_scan',{
                'title': 'QR Scanning',
                'value': false,
            });
        },
});

var CustomScreenWidget = screens.ScreenWidget.extend({
    template: 'CustomScreenWidget'
});

//declare a new variable and inherit ActionButtonWidget

var PopupButton = screens.ActionButtonWidget.extend({
  /*
  Thus PopupButton contains all methods from ActionButtonWidget.
  Now we need to define Template for our button,
  where the type of button you can find in Qweb (see below)
  */

template: 'PopupButton',
  /*
  We also need to choose the Action,
  which which will be executed after we click the button.
  For this purpose we define button_click method, where
  where name - Button name; widget - Button object;
  condition - Condition, which calls the button to show up
  (in our case, setting on show_popup_button option in POS config).
  */

button_click: function () {
  this.gui.show_popup('confirm', {
    'title': 'Popup',
    'body': 'Opening popup after clicking on the button',
    });
    this.gui.show_screen('custom_screen');
    gui.define_popup({name:'qr_scan', widget: QrScanPopupWidget});
    }
});

gui.define_screen({name:'custom_screen', widget: CustomScreenWidget});
screens.define_action_button({
  'name': 'popup_button',
  'widget': PopupButton,
//  'condition': function () {
//  return this.pos.config.popup_button;
//    },
    });
return PopupButton;
});
