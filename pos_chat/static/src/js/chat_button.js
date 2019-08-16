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
    var all_timeOuts = [];
    var chat_users = [];

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
                    args: ['', 'Disconnect', session.uid]
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

        if(all_messages[i].length == 2)
        {
            var text = all_messages[i][1].text;
            all_messages[i][1] = all_messages[i][0];
            Disappear(data.uid);
            all_messages[i][0].text = text;
        }

        Push_new_message(i, data.uid, data.message);

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
            out += '<div class="chat-user-'+item.uid+'" id="picture-'+NumInQueue(item.uid)+'">';
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
            SetPos(document.getElementById('picture-'+NumInQueue(item.uid)+''), item.uid);
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
        avatar.style.setProperty('transition','transform .2s ease-in-out');
    }
//---------Message sending part---------------------
    function TakeNewMessage()
    {
        var i = NumInQueue(session.uid);

        var newMessage = document.getElementById('text-line');

        var length = Push_new_message(i, session.uid, newMessage.value);

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
        console.log("appear");
        var i = NumInQueue(uid);
        var num = all_messages[i].length - 1;
        var mes_class = 'new-message-'+uid+'-'+num;

        var message = document.getElementById('message-id-' + uid + '');
        var out = '';

        if(num == 1)
            out += '<div id="single-message-'+uid+'-0" class="' + mes_class + '">'+
            all_messages[i][num - 1].text+'</div>';

        out += '<div id="single-message-'+uid+'-'+num+'" class="' + mes_class + '">'+
        all_messages[i][num].text+'</div>';

        message.innerHTML = out;
        if(num == 1)
            message_view('single-message-'+uid+'-0');
        if(all_messages[i][num].appeared == false)
        {
            message_view('single-message-'+uid+'-'+num);
            $("."+mes_class).fadeIn();
            all_messages[i][num].appeared = true;
            all_timeOuts[i].push(window.setTimeout(Disappear,5000, uid));
        }
    }

    function Disappear(uid)
    {
        $('.'+all_messages[NumInQueue(uid)][0].class).fadeOut();
        all_messages[NumInQueue(uid)].shift();
        all_timeOuts[NumInQueue(uid)].shift();
        console.log("disappear");
    }
//---------Help functions part----------------------

    function message_view(message_id)
    {
        single_message = document.getElementById(message_id);
        single_message.style.setProperty('border-radius', '20%');
        single_message.style.setProperty('background','white');
        single_message.style.setProperty('top','10px');
        single_message.style.setProperty('width','80px');
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
        alert( "NumInQueue returned -1" );
        return -1;
    }

    function Push_new_message(i, uid, message)
    {
        return all_messages[i].push({
            text: message,
            user_id : uid,
            class : 'new-message-'+uid+'-'+all_messages[i].length,
            appeared : false
        });
    }
//    $("." + message_class + "").fadeIn();
//    var disappear_bool_timer = window.setTimeout(function(){disappeared_first = true;},5000);

    return ChatButton;
});
