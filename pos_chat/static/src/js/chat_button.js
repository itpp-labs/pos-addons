odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens');
    //declare a new variable and inherit ActionButtonWidget

    var ChatButton = screens.ActionButtonWidget.extend({
        template: 'ChatButton',
        button_click: function () {
            this.gui.show_popup('chat',{
              'title': 'Chat',
              'value': false,
            });
        }
    });

    // Massages are stored here
    var massages = [];

    var ChatPopupWidget = PopupWidget.extend({
        template: 'ChatPopupWidget',
        show: function () {
          var self = this;
          this._super();

            this.$('.back').click(function () {
                self.gui.show_screen('products');
            });

            this.$('.next').click(function () {
                var newMassage = document.getElementById('text-line');
                var tempMassage = {
                    name : newMassage.value,
                    time : Math.floor(Date.now()/1000)
                }

                newMassage.value = '';
                massages.push(newMassage);
                saveMassages();
                showMassages();
                console.log(timeConverter(tempMassage.time));
            });
        },
    });

    gui.define_popup({name:'chat', widget: ChatPopupWidget});

    screens.define_action_button({
        'name': 'chat_button',
        'widget': ChatButton,
    });

    function saveMassages()
    {
        localStorage.setItem('massages', JSON.stringify(massages));
    }

    function showMassages()
    {
        var massageField = document.getElementById('massage-field');
        var out = '';
        massages.forEach(function (item)
        {
            out += '<p class="text-right small"><em>' + timeConverter(item.time) + '</em></p>';
            out += '<p class="text-right small"><em>' + item.name + '</em></p>';
        });
        massageField.innerHTML = out;
    }

//     Time converter function
    function timeConverter(UNIX_timestamp)
    {
        var a = new Date(UNIX_timestamp * 1000);
        var months = ['Jan', 'Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }

    return ChatButton;
});
