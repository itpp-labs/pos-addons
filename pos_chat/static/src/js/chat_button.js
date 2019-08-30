odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var screens = require('point_of_sale.screens');
    var session = require('web.session');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

    var all_messages = [];
    var all_timeOuts = [];
    var chat_users = [];
    var messages_cnt = [];
    var game_started = false;
    var users_seted = 0;
    var bus_self;
    var max_users = 20;

    var class_array = [];

    var Disconnected = false;

    var ChatButton = screens.ActionButtonWidget.extend({
        template: 'ChatButton',
        button_click: function () {
            self = this;
            this.gui.show_screen('custom_screen');

            Disconnected = false;

            Refresh(self);
        }
    });

    function Refresh(self)
    {
        if(Disconnected || users_seted > 0) return;
        self._rpc({
            model: "pos.chat",
            method: "send_field_updates",
            args: [session.name, '', 'Connect',
             session.uid]
        });
        window.setTimeout(Refresh,5000, self)
    }

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({

        initialize: function () {
          PosModelSuper.prototype.initialize.apply(this, arguments);
          var self = this;
          bus_self = self;
          self.bus.add_channel_callback("pos_chat", self.on_barcode_updates, self);
        },

        on_barcode_updates: function(data){

            var self = this;

            if(data.command == 'Connect')
            {
                if(!CheckUserExists(data.uid) && users_seted == 0)
                    AddNewUser(data);
            }
            else if(data.command == 'Disconnect')
                DeleteUser(data.uid);
            else if(data.command == 'SetName')
                NewName(data);
            else if(data.command == 'Won')
            {
                Show_winner(data);
                if(is_all_won())
                    AbortGame();
            }
            else if(data.command == 'GotName')
                GotNewName(data.uid)
            else if(data.command == 'Message')
                AddNewMessage(data);
            else
                NewName(data)
        },
    });

    var CustomScreenWidget = screens.ScreenWidget.extend({
        template: 'CustomScreenWidget',
        show: function () {
          var self = this;
          this._super();

            this.$('.back').off().click(function () {
                self.gui.show_screen('products');

                self._rpc({
                    model: "pos.chat",
                    method: "send_field_updates",
                    args: ['', '', 'Disconnect', session.uid]
                });
                Disconnected = true;
            });

            this.$('.next').off().click(function () {
                TakeNewMessage(false);
            });

            this.$("#text-line").off().keyup(function(event){

                if(event.keyCode == 13){
                    TakeNewMessage(true);
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

        if(all_messages[i].length >= 2)
        {
            clearTimeout(all_timeOuts[i][0]);
            Disappear(data.uid);
        }

        Push_new_message(i, data.uid, data.message);

        if(game_started && data.message == chat_users[NumInQueue(data.uid)].name)
            self._rpc({
                model: "pos.chat",
                method: "send_field_updates",
                args: ['', '', 'Won', data.uid]
            });

        showMessage(data.uid);
    }

    function AddNewUser(user_data)
    {
        chat_users.push({
            name : '',
            true_name : user_data.name,
            uid : user_data.uid,
            participate : false,
            won : false
        });

        all_messages.push(new Array());
        all_timeOuts.push(new Array());
        messages_cnt.push(0);

        ShowUsers();
    }

    function DeleteUser(user_id)
    {
        DeleteUserData(user_id);
        if(chat_users.length == 1 && game_started)
            AbortGame();
        if(user_id != session.uid)
            ShowUsers();
    }

    function GotNewName(uid)
    {
        var n = NumInQueue(uid);
        if(!chat_users[n].participate) users_seted++;
        chat_users[n].participate = true;

        if(chat_users.length == users_seted)
        {
            game_started = true;
            ShowUsers();
        }
        else
        {
            document.getElementById('picture-'+n).style.setProperty('background', 'green');
            document.getElementById('picture-'+n).style.setProperty('transition','0.5s linear');
            document.getElementById('picture-'+n).style.setProperty('opacity','1');
            document.getElementById('picture-'+n).style.setProperty('border-radius','30%');
        }
    }

    function NewName(data)
    {
        var n = NumInQueue(data.uid);

        if(!chat_users[back_from_next(n)].participate) users_seted++;
        chat_users[back_from_next(n)].participate = true;
        chat_users[n].name = data.message;

        if(chat_users.length == users_seted)
        {
            game_started = true;
            ShowUsers();
        }
        else
        {
            document.getElementById('picture-'+back_from_next(n)).style.setProperty('background', 'green');
            document.getElementById('picture-'+back_from_next(n)).style.setProperty('transition','0.5s linear');
            document.getElementById('picture-'+back_from_next(n)).style.setProperty('opacity','1');
            document.getElementById('picture-'+back_from_next(n)).style.setProperty('border-radius','30%');
        }
    }

    function Show_winner(data)
    {
        chat_users[NumInQueue(data.uid)].won = true;
        var out = '';
        if(data.uid == session.uid)
        {
            chat_users[NumInQueue(data.uid)].name = '';
            chat_users[NumInQueue(data.uid)].participate = false;
            user = document.getElementById('main-window');
            if(typeof user == 'null') return;
            out += '<audio src="/pos_chat/static/src/sound/puk.wav" autoplay="true"></audio>';
            out += '<img src="/pos_chat/static/src/img/win.png" id="congrats-img"></img>';
            window.setTimeout(ShowUsers,2000);
            if(user != null)
                user.innerHTML = out;
        }
        else
        {
            if(document.getElementById('picture-'+NumInQueue(data.uid)) == null) return;
            document.getElementById('picture-'+NumInQueue(data.uid)).style.setProperty('background', 'green');
            document.getElementById('picture-'+NumInQueue(data.uid)).style.setProperty('transition','0.5s linear');
            document.getElementById('picture-'+NumInQueue(data.uid)).style.setProperty('opacity','1');
            document.getElementById('picture-'+NumInQueue(data.uid)).style.setProperty('border-radius','30%');
        }
    }

//----------Set avatar and animation part--------------
    var radius = 200;

    function ShowUsers()
    {
        var window = document.getElementById('main-window');
        var out = '';
        chat_users.forEach(function (item)
        {
            out += '<div class="chat-user-'+item.uid+'" id="picture-'+NumInQueue(item.uid)+'">';
            out += '<div class="user-name">'+chat_users[NumInQueue(item.uid)].true_name+'</div>';
            out += '<img src="/web/image/res.users/' +
            item.uid + '/image_small" id="ava-' +
            NumInQueue(item.uid)+'" class="avatar"></img>';

            if(game_started && !chat_users[NumInQueue(item.uid)].won && session.uid != item.uid)
               out += '<div class="user-name">'+chat_users[NumInQueue(item.uid)].name+'</div>';

            out += '<ul class="new-message" id="message-id-'+item.uid+'"></ul>';
            out += '</div>';
        });
        window.innerHTML = out;

        chat_users.forEach(function(item){
            var avatar = document.getElementById('ava-'+NumInQueue(item.uid)+'');
            avatar.style.setProperty('border-radius', '50%');
            SetPos(document.getElementById('picture-'+NumInQueue(item.uid)), item.uid);
        });
    }

    function SetPos(avatar, uid)
    {
        var cnt = NumInQueue(uid) + 1;
        var action_window = document.getElementById('main-window');
        var angle = (2 * 3.1415 / chat_users.length) * cnt;
        var w = action_window.offsetWidth;
        var h = action_window.offsetHeight;

        var x = Math.trunc(radius*Math.cos(angle));
        var y = Math.trunc(radius*Math.sin(angle));

        avatar.style.setProperty('position', 'absolute');
        avatar.style.setProperty('left', w/2 - (avatar.offsetWidth / 2) + 'px');
        avatar.style.setProperty('top', h/2 - (avatar.offsetHeight / 2) + 'px');
        avatar.style.setProperty('transform','translate3d('+x+'px,'+y+'px,0px)');
        avatar.style.setProperty('transition','transform .3s ease-in-out');
    }
//---------Message sending part---------------------
    function TakeNewMessage(delete_last_char)
    {
        var i = NumInQueue(session.uid);

        var newMessage = document.getElementById('text-line');

        if(newMessage.value == '') {newMessage.value = ''; return;}

        var text = newMessage.value;
        if(delete_last_char) text.substring(0, text.length - 2);

        if(!game_started && chat_users.length > 1)
        {
            self._rpc({
                model: "pos.chat",
                method: "send_to_channel_all_but_id",
                args: [text, chat_users[next_to_me(session.uid)].uid]
            });

            self._rpc({
                model: "pos.chat",
                method: "send_to_channel_by_id",
                args: [chat_users[next_to_me(session.uid)].uid, session.uid, 'GotName']
            });
        }

        if(is_it_tag(newMessage.value, false))
            text = is_it_tag(newMessage.value, true);

        if(game_started && newMessage.value != chat_users[i].name)
            self._rpc({
                model: "pos.chat",
                method: "send_field_updates",
                args: ['', text, 'Message', session.uid]
            });

        newMessage.value = '';
    }

    function showMessage(uid)
    {
        var i = NumInQueue(uid), num = all_messages[i].length - 1;
        var cnt = messages_cnt[i]++;
        var num = all_messages[i].length - 1;

        var mes_class = 'new-message-'+uid+'-'+cnt;
        all_messages[i][num].class = mes_class;
        var mes_id = 'single-message-'+uid+'-'+cnt;

        var message = document.getElementById('message-id-' + uid);
        if(message == null) return;
        var out = '';

        if(num > 0)
            out += '<li id="single-message-'+uid+'-'+
            (cnt - 1)+'" class="new-message-'+uid+'-'+(cnt - 1)+ '">'+
            all_messages[i][num - 1].text+'</li>';

        out += '<li id="'+mes_id+'" class="' + mes_class + '">'+
        all_messages[i][num].text+'</li>';

        out += '<audio src="/pos_chat/static/src/sound/msg.wav" autoplay="true"></audio>';

        message.innerHTML = out;
        if(num > 0)
            message_view('single-message-'+uid+'-'+(cnt - 1), false);

        message_view(mes_id, true);
        $("."+mes_class).fadeIn();
        all_timeOuts[i].push(window.setTimeout(Disappear,15000, uid));
    }

    function Disappear(uid)
    {
        if(typeof all_messages[NumInQueue(uid)] == 'undefined') return;
        if(all_messages[NumInQueue(uid)].length == 0) return;
        $('.'+all_messages[NumInQueue(uid)][0].class).fadeOut();
        all_messages[NumInQueue(uid)].shift();
        all_timeOuts[NumInQueue(uid)].shift();
    }
//---------Help functions part----------------------

    function message_view(message_id, display)
    {
        single_message = document.getElementById(message_id);
        single_message.style.setProperty('border-radius', '20%');
        single_message.style.setProperty('background','white');
        single_message.style.setProperty('top','10px');
        single_message.style.setProperty('width','100px');
        single_message.style.setProperty('font','14pt sans-serif');
        if(display)
            single_message.style.setProperty('display', 'none');
    }

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
    }

    function Push_new_message(i, uid, message)
    {
        return all_messages[i].push({
            text: message,
            user_id : uid,
            class : 'new-message-'+uid+'-'+all_messages[i].length,
            cnt : -1
        });
    }

    function DeleteUserData(uid)
    {
        var j = NumInQueue(uid);
        for(var i = j; i < chat_users.length; i++)
        {
            chat_users[i] = chat_users[i + 1];
            all_messages[i] = all_messages[i + 1];
            all_timeOuts[i] = all_timeOuts[i + 1];
        }
        messages_cnt.pop();
        chat_users.pop();
        all_messages.pop();
        all_timeOuts.pop();
    }

    function is_it_tag(str, send)
    {
        var left = 0, right = 0, slash = 0;
        var text = '';
        for(var i = 0; i < str.length; i++)
        {
            if(left + right == 2 && str[i] != '<')
                text += str[i];
            if(str[i] == '<')left++;
            if(str[i] == '>')right++;
            if(str[i] == '/') slash++;
        }

        if(send) return text;
        if(left == 2 && right == 2 && slash == 1)
            return true;
        else
            return false;
    }

    function is_all_won()
    {
        for(var i = 0; i < chat_users.length; i++)
        {
            if(!chat_users[i].won) return false;
        }
        return true;
    }

    function AbortGame()
    {
        game_started = false;
        users_seted = 0;
        chat_users.forEach(function(item)
        {
            item.name = '';
            item.participate = false;
            item.won = false;
        });
        if(chat_users.length > 1)
            window.setTimeout(ShowUsers,2000);
    }

    function next_to_me(uid)
    {
        if(NumInQueue(uid) == chat_users.length - 1) return 0;
        else return NumInQueue(uid) + 1;
    }

    function back_from_next(n)
    {
        if(n == 0) return (chat_users.length - 1);
        else return n - 1;
    }
//    $("." + message_class + "").fadeIn();
//    var disappear_bool_timer = window.setTimeout(function(){disappeared_first = true;},5000);

    return ChatButton;
});
