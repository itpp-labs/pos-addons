//odoo.define('pos_chat_button', function (require){
//      'use_strict';
//
//    var gui = require('point_of_sale.gui');
//    var PopupWidget = require('point_of_sale.popups');
//    var screens = require('point_of_sale.screens');
//    var rpc = require('web.rpc');
//    var session = require('web.session');
//
//    var models = require('point_of_sale.models');
//    //declare a new variable and inherit ActionButtonWidget
//
//    var ChatButton = screens.ActionButtonWidget.extend({
//        template: 'ChatButton',
//        button_click: function () {
//            this.gui.show_popup('chat',{
//              'title': 'Chat',
//              'value': false,
//            });
//            if(messages.length == 0)
//            {
//                var messageList = document.getElementById('message-list');
//                messageList.innerHTML = '<li class="text-right small"><em>Welcome to chat!</em></li>';
//                loadComments();
//            }
//            else showMessages();
//        }
//    });
//
//
//    // Messages are stored here
//    var messages = [];
//    var user = session.name;
//
//    var PosModelSuper = models.PosModel;
//    models.PosModel = models.PosModel.extend({
//
//        initialize: function () {
//
//          PosModelSuper.prototype.initialize.apply(this, arguments);
//          var self = this;
//
//          self.bus.add_channel_callback("pos_chat_228", self.on_barcode_updates, self);
//        },
//
//        on_barcode_updates: function(data){
//
//            var self = this;
//
//            var tempMessage = {
//                text : data.message,
//                time : data.date,
//                name : data.name
//            }
//
//            AddNewMessage(tempMessage);
//        },
//    });
//
//    var ChatPopupWidget = PopupWidget.extend({
//        template: 'ChatPopupWidget',
//        show: function () {
//          var self = this;
//          this._super();
//
//            this.$('.back').click(function () {
//                self.gui.show_screen('products');
//            });
//
//            this.$('.next').click(function () {
//                var newMessage = document.getElementById('text-line');
//                var tempMessage = {
//                    text : newMessage.value,
//                    time : Math.floor(Date.now()/1000),
//                    name : session.name
//                }
//
//                newMessage.value = '';
//
//                self._rpc({
//                    model: "pos.chat",
//                    method: "send_field_updates",
//                    args: [tempMessage.text, tempMessage.time, tempMessage.name]
//                })
//            });
//        },
//    });
//
//    function AddNewMessage(message)
//    {
//        messages.push(message);
//        saveMessages();
//        showMessages();
//    }
//
//    gui.define_popup({name:'chat', widget: ChatPopupWidget});
//
//    screens.define_action_button({
//        'name': 'chat_button',
//        'widget': ChatButton,
//    });
//
//    function saveMessages()
//    {
//        localStorage.setItem('messages', JSON.stringify(messages));
//    }
//
//    function showMessages()
//    {
//        var messageList = document.getElementById('message-list');
//        var out = '';
//        messages.forEach(function (item)
//        {
//        out += '<li class="text-right small"><em>' + timeConverter(item.time) + ' (' + item.name +'):</em></li>';
//        out += '<li class="text-right small"><em>' + item.text + '</em></li>';
//        });
//        messageList.innerHTML = out;
//    }
//
//    function loadComments()
//    {
//        localStorage.setItem('messages', JSON.stringify(messages));
//    }
//
////     Time converter function
//    function timeConverter(UNIX_timestamp)
//    {
//        var a = new Date(UNIX_timestamp * 1000);
//        var months = ['Jan', 'Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//        var year = a.getFullYear();
//        var month = months[a.getMonth()];
//        var date = a.getDate();
//        var hour = a.getHours();
//        var min = a.getMinutes();
//        var sec = a.getSeconds();
//        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
//        return time;
//    }
//
//    return ChatButton;
//});

odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var screens = require('point_of_sale.screens');
    var session = require('web.session');
    var PopupWidget = require('point_of_sale.popups');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

    var models = require('point_of_sale.models');

    var all_messages = [];
    var chat_users = [];

    var all_timeOuts = [];
    var class_array = [];

    var ChatButton = screens.ActionButtonWidget.extend({
        template: 'ChatButton',
        button_click: function () {
            self = this;
            this.gui.show_screen('custom_screen');

            if(!CheckUserExists(session.uid))
            {
                AddNewUser({
                    name : session.name,
                    uid : session.uid
                });
            }

            ShowUsers();


            self._rpc({
                model: "pos.chat",
                method: "send_field_updates",
                args: ['', 'Connect',
                 session.uid]
            });
        }
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({

        initialize: function () {

          PosModelSuper.prototype.initialize.apply(this, arguments);
          var self = this;

          self.bus.add_channel_callback("pos_chat_228", self.on_barcode_updates, self);
        },

        on_barcode_updates: function(data){

            var self = this;

            if(session.uid == data.uid) return;

            if(data.command == 'Connect')
            {
                if(!CheckUserExists(data.uid))
                    AddNewUser(data);
            }
            else if(data.command == 'Disconnect')
                DeleteUser(data.uid);
            else
                AddNewMessage(data);

        },
    });

    var CustomScreenWidget = screens.ScreenWidget.extend({
        template: 'CustomScreenWidget',
        show: function () {
          var self = this;
          this._super();

            this.$('.back').click(function () {
                self.gui.show_screen('products');

                self._rpc({
                    model: "pos.chat",
                    method: "send_field_updates",
                    args: ['', Disconnect, session.uid]
                });

            });

            this.$('.next').click(function () {
                TakeNewMessage()
            });

            this.$("#text-line").keyup(function(event){

                if(event.keyCode == 13){
                    TakeNewMessage()
                }
            });
        }
    });

    gui.define_screen({name:'custom_screen', widget: CustomScreenWidget});

    screens.define_action_button({
        'name': 'chat_button',
        'widget': ChatButton,
    });

//----------Users relations part-----------------

    function AddNewMessage(data)
    {
        var i = NumInQueue(data.uid);
        all_messages[i].push({
            text: data.text,
            user_id : data.uid
        });
        showMessage(data.uid);
    }

    function AddNewUser(user_data)
    {
        chat_users.push({
            name : user_data.name,
            uid : user_data.uid
        });

        all_messages.push(new Array());
        all_timeOuts.push(new Array());

        ShowUsers();
    }

    function DeleteUser(user_id)
    {
        for(var i = 0; i < chat_users.length; i++)
        {
            if(chat_users[i].uid == user_id)
            {
                // Array shift
                for(var j = i; j < chat_users.length - 1; j++)
                    chat_users[j] = chat_users[j + 1];
                // Delete array's last object
                chat_users.pop();
            }
        }
        ShowUsers();
    }

//----------Set avatar and animation part--------------
    var radius = 200;

    function ShowUsers()
    {
        var window = document.getElementById('main-window');
        var out = '';
        chat_users.forEach(function (item)
        {
            out += '<div class="chat-user-'+item.uid+'" id="picture-'+item.uid+'">';
            out += '<img src="/web/image/res.partner/' +
            (item.uid + 1) + '/image_small" id="ava-' +
            NumInQueue(item.uid)+'" class="avatar"></img>';

            out += '<div class="new-message" id="message-id-'+item.uid+'"></div>';
            out += '</div>';
        });
        window.innerHTML = out;

        chat_users.forEach(function(item){
            var avatar = document.getElementById('ava-'+NumInQueue(item.uid)+'');
        avatar.style.setProperty('border-radius', '50%');
            SetPos(document.getElementById('picture-'+item.uid+''), item.uid);
        });
    }

    function SetPos(avatar, uid)
    {
        var cnt = NumInQueue(uid) + 1;
        var action_window = document.getElementById('main-window');
        var angle = 2 * 3.1415 / cnt;
        var circle_x = action_window.offsetWidth / 2;
        var circle_y = action_window.offsetHeight / 2;
        var x = circle_x + radius*Math.cos(angle);
        var y = circle_y + radius*Math.sin(angle);

        avatar.style.setProperty('position', 'absolute');
        avatar.style.setProperty('left', x - (avatar.offsetWidth / 2) + 'px');
        avatar.style.setProperty('right', y - (avatar.offsetHeight / 2) + 'px');
    }

//---------Message sending part---------------------
    function TakeNewMessage()
    {
        var i = NumInQueue(session.uid);

        if(all_messages[i].length == 2)
        {
            var text = all_messages[i][1].text;
            all_messages[i][1] = all_messages[i][0];
            Disappear(i, 'new-message-' + session.uid + '-0');
            all_messages[i][0].text = text;
        }

        var newMessage = document.getElementById('text-line');

        var length = all_messages[i].push({
            text : newMessage.value,
            user_id : session.uid,
            class : 'new-message-' + session.uid + '-' + all_messages[i].length
        });

        ClearBadData(i);

        var temp_class = all_messages[i][length - 1].class;

        showMessage(session.uid);

        self._rpc({
            model: "pos.chat",
            method: "send_field_updates",
            args: [newMessage.value,
             '', session.uid]
        });

        newMessage.value = '';
    }

    function showMessage(uid)
    {
        var i = NumInQueue(uid);
        var num = all_messages[i].length - 1;
        var class1 = 'new-message-' + uid + '-1';
        var message = document.getElementById('message-id-' + uid + '');
        var out = '';

        if(num == 1)
        {
            var class0 = 'new-message-' + uid + '-0';
            out += '<div class="' + class0 + '">'+
            all_messages[i][num - 1].text+'</div>';
        }

        out += '<div class="' + class1 + '">'+
        all_messages[i][num].text+'</div>';
        message.innerHTML = out;
    }

    function Disappear(i, class_n)
    {
        $("."+ class_n +"").fadeOut();
        all_messages[i].shift();
    }
//---------Help functions part----------------------

    function CheckUserExists(uid)
    {
        for(var i = 0; i < chat_users.length; i++)
        {
            if(uid == chat_users[i].uid) return true;
        }
        return false;
    }

    // Checks out which num user has
    function NumInQueue(uid)
    {
        for(var i = 0; i < chat_users.length; i++)
        {
            if(chat_users[i].uid == uid) return i;
        }
        alert( "NumInQueue returned -1" );
        return -1;
    }

    // Clears others messages,
    // cause push() func. pushes object
    // to the all cells in array
    function ClearBadData(ind)
    {
        for(var i = 0; i < all_messages.length; i++)
        {
            if(ind != i)
            {
                all_messages[i].length = 0;
            }
        }
    }
//    $("." + message_class + "").fadeIn();
//    var disappear_bool_timer = window.setTimeout(function(){disappeared_first = true;},5000);

    return ChatButton;
});




//    function SendMessage(uid)
//    {
//        var i = NumInQueue(uid);
//        if(all_messages[i].length == 2)
//        {
//            var text = all_messages[i][1].text;
//            all_messages[i][1] = all_messages[i][0];
//            clearTimeout(all_timeOuts[i][0]);
//            Disappear(i, all_messages[i]);
//            all_messages[i][0].text = text;
//        }
//
//        var newMessage = document.getElementById('text-line');
//        var current_message = {
//            text : newMessage.value,
//            time : Math.floor(Date.now()/1000),
//            user_id : uid,
//            class : 'new-message-' + uid + '-' + all_messages[i].length,
//            id : 'message-id-' + uid + '-' + all_messages[i].length,
//            appeared : false
//        }
//
//
//        if(all_messages[i].length == 1 && all_messages[i][0].class == 'new-message-1')
//        {
//            all_messages[i][0].class = 'new-message-0';
//            all_messages[i][0].id = 'message-id-0';
//        }
//
//        all_messages[i].push(current_message);
//        for(var j = 0; j < all_messages.length; j++)
//        {
//            if(j!=i)
//                all_messages[j].pop();
//        }
//
//        self._rpc({
//            model: "pos.chat",
//            method: "send_field_updates",
//            args: [current_message.text, current_message.time,
//             '', '', session.uid]
//        });
//
//        showMessages(current_message ,uid, i);
//        newMessage.value = '';
//    }
//
//    function showMessages(new_message, uid, i)
//    {
//        var num = all_messages[i].length - 1;
//        message = document.getElementById('message-id-' + uid + '');
//
//        var out ='';
//        if(num == 1)
//            out += '<div class="' + all_messages[i][num - 1].class + '" id="' +
//            all_messages[i][num - 1].id + '"><em>' + all_messages[i][num - 1].text + '</em></div>';
//
//        out += '<div class="' + new_message.class + '" id="' +
//        new_message.id + '"><em>' + new_message.text + '</em></div>';
//
//        message.innerHTML = out;
//
//        if(new_message.appeared == false)
//        {
//            $("."+ new_message.class +"").fadeIn();
//            new_message.appeared = true;
//            all_timeOuts[i].push(window.setTimeout(Disappear,5000,i, new_message));
//        }
//    }
//
//    function Disappear(i, new_message)
//    {
//        $("."+ new_message.class +"").fadeOut();
//        all_messages[i].shift();
//        all_timeOuts[i].shift();
//    }
