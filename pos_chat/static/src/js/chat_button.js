odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var screens = require('point_of_sale.screens');
    var session = require('web.session');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

//-------------------- Variables -----------------------

    // All users messages stored here
    var all_messages = [];
    // Messages timeouts needs to store,
    // cause only this way we can know when to delete the message
    var all_timeOuts = [];
    // Information about every user
    var chat_users = [];
    // I don't remember why i added this,
    // but without it, app don't work:D
    var messages_cnt = [];
    // Are user in chat room right now
    var in_chat = false;

//------------------------------------------------------

//-------------Help functions part----------------------
    // Checks out which num user has
    function NumInQueue(uid)
    {
        for(var i = 0; i < chat_users.length; i++)
        {
            if(chat_users[i].uid == uid) return i;
        }
    }

//------------------------------------------------------

//-------------- New screen defenition -----------------
    var ChatButton = screens.ActionButtonWidget.extend({
        template: 'ChatButton',
        button_click: function () {
            self = this;
            this.gui.show_screen('custom_screen');
            // User in to the chat room
            in_chat = true;
            // Current users says that he connected to other users
            self._rpc({
                model: "pos.chat",
                method: "send_field_updates",
                args: [session.name, '', 'Connect',
                 session.uid]
            });
        }
    });

//------------------------------------------------------

//-------------- Longpooling functions -----------------

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({

        initialize: function () {

            PosModelSuper.prototype.initialize.apply(this, arguments);
            var self = this;
            // Listen to 'pos_chat' channel
            self.bus.add_channel_callback("pos_chat", self.on_barcode_updates, self);
        },

        on_barcode_updates: function(data){
            if(!in_chat) {return;}
            var self = this;
            // If someone connected to the chat
            if(data.command == 'Connect')
            {
                if(!CheckUserExists(data.uid))
                    AddNewUser(data);
            }
            else if(data.command == 'Disconnect')
                DeleteUser(data.uid);
            else if(data.command == 'SetName') // If new name setted by the neighbour
                NewName(data);
            else if(data.command == 'Won') // If this user guessed his game name
                Show_winner(data);
            else if(data.command == 'GotName')
                GotNewName(data.uid)
            else if(data.command == 'Message') // If someone throwed a message
                AddNewMessage(data);
            else if(data.command == 'AllowChange')
                AllowChangeName(data);
            else if(data.command == 'Exist')
                AddExistUser(data);
            else // If someone added the name to his neighbour
                NewName(data)
        },
    });

//------------------------------------------------------

//---------- Text insertion buttons control ------------
    var CustomScreenWidget = screens.ScreenWidget.extend({
        template: 'CustomScreenWidget',
        show: function () {
          var self = this;
          this._super();
            // Returning to POS main screen
            this.$('.back').off().click(function () {
                self.gui.show_screen('products');

                self._rpc({
                    model: "pos.chat",
                    method: "send_field_updates",
                    args: ['', '', 'Disconnect', session.uid]
                });

                DeleteMyData();
            });
            // Send new messages using button
            this.$('.next').off().click(function () {
                TakeNewMessage(false);
            });
            // Send new messages using 'Enter' key on keyboard
            this.$("#text-line").off().keyup(function(event){
                if(event.keyCode == 13){
                    TakeNewMessage(true);
                }
            });
//-------------- Game Control Buttons ------------------

            var set_but = document.getElementById('set-game-name');
            var allow_but = document.getElementById('allow-set-name');

            set_but.onclick = function ()
            {
                SetNewName();
            }

            allow_but.onclick = function ()
            {
                self._rpc({
                    model: "pos.chat",
                    method: "send_field_updates",
                    args: ['', '', 'AllowChange', session.uid]
                });
            }

        //------------------------------------------------------
        }
    });

    // Defining new screen
    gui.define_screen({name:'custom_screen', widget: CustomScreenWidget});

    screens.define_action_button({
        'name': 'chat_button',
        'widget': ChatButton,
    });

//------------------------------------------------------

//--------------- Users relations part -----------------

    function AddNewMessage(data)
    {
        var i = NumInQueue(data.uid);

        if(all_messages[i].length >= 2)
        {
            clearTimeout(all_timeOuts[i][0]);
            Disappear(data.uid);
        }

        Push_new_message(i, data.uid, data.message);

        if(data.message == chat_users[NumInQueue(data.uid)].name)
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
            allow_change_name: true
        });

        all_messages.push(new Array());
        all_timeOuts.push(new Array());
        messages_cnt.push(0);
        if(user_data.uid == session.uid) {ShowUsers();return;}
        var i = NumInQueue(session.uid);

        // Tell to new user about current user
        self._rpc({
            model: "pos.chat",
            method: "send_to_user",
            args: [chat_users[i].name, chat_users[i].true_name,
            chat_users[i].participate, chat_users[i].allow_change_name,
            session.uid, 'Exist', user_data.uid]
        });

        if(in_chat)
        {
            ShowUsers();
        }
    }

    function AddExistUser(data)
    {
        chat_users.push({
            name : data.name,
            true_name : data.true_name,
            uid : data.uid,
            participate : data.participate,
            allow_change_name: data.allow
        });
        var n = chat_users.length;
        var temp = chat_users[n - 1];
        chat_users[n - 1] = chat_users[n - 2];
        chat_users[n - 2] = temp;

        all_messages.push(new Array());
        all_timeOuts.push(new Array());
        messages_cnt.push(0);

        ShowUsers();
    }

    function DeleteUser(user_id)
    {
        DeleteUserData(user_id);
        if(user_id != session.uid)
            ShowUsers();
    }

    function GotNewName(uid)
    {
        var n = NumInQueue(uid);
        chat_users[n].participate = true;
    }

    function NewName(data)
    {
        var n = NumInQueue(data.uid);

        chat_users[back_from_next(n)].participate = true;
        chat_users[n].name = data.message;

        under_text = document.getElementById('game-nick-'+data.uid);
        under_text.style.setProperty('opacity','1');
        under_text.style.setProperty('transition','0.5s ease-in');
        under_text.innerHTML = chat_users[n].name;
    }

    function Show_winner(data)
    {
        var out = '';
        var n = NumInQueue(data.uid);
        chat_users[NumInQueue(data.uid)].name = '';
        if(data.uid == session.uid)
        {
            chat_users[n].name = '';
            chat_users[n].participate = false;
            user = document.getElementById('main-window');
            if(typeof user === null) return;
            out += '<audio src="/pos_chat/static/src/sound/puk.wav" autoplay="true"></audio>';
            out += '<img src="/pos_chat/static/src/img/win.png" id="congrats-img"></img>';
            window.setTimeout(ShowUsers,2000);
            if(user != null)
                user.innerHTML = out;
        }
        else
        {
            if(document.getElementById('picture-'+n) == null) return;
            under_text = document.getElementById('game-nick-'+data.uid);
            under_text.style.setProperty('opacity','0');
            under_text.style.setProperty('transition','1s ease-in');
            under_text.innerHTML = chat_users[n].name;
        }
    }

    function AllowChangeName(data)
    {
        var hat_text = document.getElementById('user-name-'+data.uid);
        var i = NumInQueue(data.uid);
        if(chat_users[i].allow_change_name)
        {
            hat_text.style.setProperty('background','red');
            hat_text.style.setProperty('color','white');
            chat_users[i].allow_change_name = false;
        }
        else
        {
            hat_text.style.setProperty('background','#a9a9ff');
            hat_text.style.setProperty('color','white');
            chat_users[i].allow_change_name = true;
        }
        hat_text.style.setProperty('transition','0.2s ease-in');
    }

//------------------------------------------------------

//---------- Set avatar and animation part -------------
    var radius = 200;

    function ShowUsers()
    {
        var window = document.getElementById('main-window');
        var out = '';
        var visible = 0;
        chat_users.forEach(function (item)
        {
            var i = NumInQueue(item.uid);
            out += '<div class="chat-user-'+item.uid+'" id="picture-'+i+'">';
            out += '<div class="user-name" id="user-name-'+item.uid+'">'+chat_users[i].true_name+'</div>';
            out += '<img src="/web/image/res.users/' +
            item.uid + '/image_small" id="ava-' + i +'" class="avatar" style="border-radius:50%;"></img>';
            if(chat_users[i].name != '') visible = 1;
            else visible = 0;
            out += '<div class="user-name" id="game-nick-'+item.uid+'" style="opacity: '+visible+'">'+
            chat_users[i].name+'</div>';

            out += '<ul class="new-message" id="message-id-'+item.uid+'"></ul>';
            out += '</div>';
        });
        window.innerHTML = out;

        chat_users.forEach(function(item){
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
//------------------------------------------------------

//------ Message taking and showing functions ----------

    function TakeNewMessage(delete_last_char)
    {
        var i = NumInQueue(session.uid);

        var newMessage = document.getElementById('text-line');

        if(newMessage.value == '') {newMessage.value = ''; return;}

        var text = newMessage.value;
        if(delete_last_char) text.substring(0, text.length - 2);

        if(is_it_tag(newMessage.value, false))
            text = is_it_tag(newMessage.value, true);

        self._rpc({
            model: "pos.chat",
            method: "send_field_updates",
            args: ['', text, 'Message', session.uid]
        });

        newMessage.value = '';
    }

    function SetNewName()
    {
        var newMessage = document.getElementById('text-line');
        if(newMessage.value == '') {newMessage.value = ''; return;}
        var text = newMessage.value;

        if(chat_users.length > 1 && chat_users[next_to_me(session.uid)].allow_change_name)
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
        else
        {
            alert("Oops! You can't change your neighbours name");
        }

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
        if(typeof message === null) {return};
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

    // Messages slow disapperaring
    function Disappear(uid)
    {
        if(typeof all_messages[NumInQueue(uid)] === 'undefined') {return};
        if(all_messages[NumInQueue(uid)].length == 0) {return};
        $('.'+all_messages[NumInQueue(uid)][0].class).fadeOut();
        all_messages[NumInQueue(uid)].shift();
        all_timeOuts[NumInQueue(uid)].shift();
    }
//--------------------------------------------------

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

    function Push_new_message(i, uid, message)
    {
        return all_messages[i].push({
            text: message,
            user_id : uid,
            class : 'new-message-'+uid+'-'+all_messages[i].length,
            cnt : -1
        });
    }
    // Users all data deletion
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

    function DeleteMyData()
    {
        chat_users = [];
        all_messages = [];
        all_timeOuts = [];
        messages_cnt = [];
        // User out of the chat room
        in_chat = false;
    }
    // Is this string the tag checking
    function is_it_tag(str, send)
    {
        var left = 0, right = 0, slash = 0;
        var text = '';
        for(var i = 0; i < str.length; i++)
        {
            if(left + right === 2 && str[i] !== '<')
            {
                text += str[i];
            }
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
    // Returns pointer to the neighbour
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
//--------------------------------------------------
    return ChatButton;
});
