odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var ChatWidget = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens');
    //declare a new variable and inherit ActionButtonWidget

    var ChatButton = screens.ActionButtonWidget.extend({
      /*
      Thus ChatButton contains all methods from ActionButtonWidget.
      Now we need to define Template for our button,
      where the type of button you can find in Qweb (see below)
      */

        template: 'ChatButton',
      /*
      We also need to choose the Action,
      which which will be executed after we click the button.
      For this purpose we define button_click method, where
      where name - Button name; widget - Button object;
      condition - Condition, which calls the button to show up
      (in our case, setting on show_popup_button option in POS config).
      */
        button_click: function () {
            this.gui.show_screen('custom_screen');
        }
    });

    var CustomScreenWidget = screens.ScreenWidget.extend({
        template: 'CustomScreenWidget'
    });

    gui.define_screen({name:'custom_screen', widget: CustomScreenWidget});

        screens.define_action_button({
          'name': 'chat_button',
          'widget': ChatButton,
        });

    return ChatButton;
});
