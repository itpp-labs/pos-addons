odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens');
    var rpc = require('web.rpc');
    var session = require('web.session');

    var models = require('point_of_sale.models');
    //declare a new variable and inherit ActionButtonWidget

    var ChatButton = screens.ActionButtonWidget.extend({
        template: 'ChatButton',
        button_click: function () {
            this.gui.show_popup('chat',{
              'title': 'Chat',
              'value': false,
            });
            if(messages.length == 0)
            {
                var messageList = document.getElementById('message-list');
                messageList.innerHTML = '<li class="text-right small"><em>Welcome to chat!</em></li>';
                loadComments();
            }
            else showMessages();
        }
    });


    // Messages are stored here
    var messages = [];
    var user = session.name;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({

        initialize: function () {

          PosModelSuper.prototype.initialize.apply(this, arguments);
          var self = this;

          self.bus.add_channel_callback("pos_chat_228", self.on_barcode_updates, self);
        },

        on_barcode_updates: function(data){

            var self = this;
            console.log("Hello!!!");

            var tempMessage = {
                text : data.message,
                time : data.date,
                name : data.name
            }

            AddNewMessage(tempMessage);
        },
    })

    var ChatPopupWidget = PopupWidget.extend({
        template: 'ChatPopupWidget',
        show: function () {
          var self = this;
          this._super();

            this.$('.back').click(function () {
                self.gui.show_screen('products');
            });

            this.$('.next').click(function () {
                var newMessage = document.getElementById('text-line');
                var tempMessage = {
                    text : newMessage.value,
                    time : Math.floor(Date.now()/1000),
                    name : session.name
                }

                newMessage.value = '';

                self._rpc({
                    model: "pos.chat",
                    method: "send_field_updates",
                    args: [tempMessage.text, tempMessage.time, tempMessage.name]
                })
            });
        },
    });

    function AddNewMessage(message)
    {
        messages.push(message);
        saveMessages();
        showMessages();
    }

    gui.define_popup({name:'chat', widget: ChatPopupWidget});

    screens.define_action_button({
        'name': 'chat_button',
        'widget': ChatButton,
    });

    function saveMessages()
    {
        localStorage.setItem('messages', JSON.stringify(messages));
    }

    function showMessages()
    {
        var messageList = document.getElementById('message-list');
        var out = '';
        messages.forEach(function (item)
        {
        out += '<li class="text-right small"><em>' + timeConverter(item.time) + ' (' + item.name +'):</em></li>';
        out += '<li class="text-right small"><em>' + item.text + '</em></li>';
        });
        messageList.innerHTML = out;
    }

    function loadComments()
    {
        localStorage.setItem('messages', JSON.stringify(messages));
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
