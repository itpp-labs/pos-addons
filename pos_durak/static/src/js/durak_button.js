odoo.define('pos_chat_button', function (require){
      'use_strict';

    let gui = require('point_of_sale.gui');
    let screens = require('point_of_sale.screens');
    let session = require('web.session');
    let models = require('point_of_sale.models');
    let rpc = require('web.rpc');

//-------------------- Variables -----------------------

    // All users messages stored here
    let all_messages = [];
    // Messages timeouts needs to store,
    // cause only this way we can know when to delete the message
    let all_timeOuts = [];
    // Information about every user
    let chat_users = [];
    // I don't remember why i added this,
    // but without it, app don't work:D
    let messages_cnt = [];
    // Are user in chat room right now
    let in_chat = false;
    // Full channel name
    let channel = "pos_chat";
    // Shows game stage
    let game_started = false;
    // Beated cards
    let beated = [];
    // Donald Trump
    let trump = '';
    // who moves
    let who_moves = -1;
    // Game mode
    let attacking = false;

//------------------------------------------------------

//-------------Help functions part----------------------
    // Checks out which num user has
    function NumInQueue(uid){
        for(let i = 0; i < chat_users.length; i++){
            if(chat_users[i].uid === uid) {
                return i;
            }
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
                model: "pos.session",
                method: "send_field_updates",
                args: [session.name, '', 'Connect',
                 session.uid]
            });
        }
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
                    model: "pos.session",
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
                if(event.keyCode === 13){
                    TakeNewMessage(true);
                }
            });

            window.onclick=function(e){
                let elem = e ? e.target : window.event.srcElement;
                if(elem.id[0]+elem.id[1]+elem.id[2]+elem.id[3] === 'card'){
                   let num = '';
                   if(elem.id[elem.id.length - 2] !== '-') num = elem.id[elem.id.length - 2];
                   num += elem.id[elem.id.length - 1];
                   Move(num);
                }
                else if(elem.id === "ready-button"){
                    self._rpc({
                        model: "pos.session",
                        method: "game_started",
                        args: [session.uid, chat_users.length]
                    });
                }
            }
        }
    });

    // Defining new screen
    gui.define_screen({name:'custom_screen', widget: CustomScreenWidget});

    screens.define_action_button({
        'name': 'durak_button',
        'widget': ChatButton,
    });

//------------------------------------------------------

//---------- Set avatar and animation part -------------
    var radius = 200;

    function ShowCards(){
        let window = document.getElementById('main-window');
        let block = document.getElementById('cards');
        let me = NumInQueue(session.uid);
        let out = '', w = (60/chat_users[me].cards.length)/2;
        for(let i = 0; i < chat_users[me].cards.length; i++){
            let n = chat_users[me].cards[i];
            out+='<img type="button" src="/pos_durak/static/src/img/kards/'+
            n+'.png" id="card-'+n+'" class="card" style="right: '+(30 - i*w)+'%"></img>'
        }
        block.innerHTML = out;
    }

    function ShowUsers(){
        let window = document.getElementById('main-window');
        let out = '';
        let visible = 0;
        chat_users.forEach(function (item){
            let i = NumInQueue(item.uid);
            out += '<div class="chat-user-'+item.uid+'" id="picture-'+i+'">';
            out += '<div class="user-name" id="user-name-'+item.uid+'">'+chat_users[i].true_name+'</div>';
            out += '<img src="/web/image/res.users/' +
            item.uid + '/image_small" id="ava-' + i +'" class="avatar" style="border-radius:50%;"></img>';

            out += '<ul class="new-message" id="message-id-'+item.uid+'"></ul>';
            out += '</div>';
        });
        window.innerHTML = out;

        chat_users.forEach(function(item){
            SetPos(document.getElementById('picture-'+NumInQueue(item.uid)), item.uid);
        });
    }

    function SetPos(avatar, uid){
        let cnt = NumInQueue(uid) + 1;
        let action_window = document.getElementById('main-window');
        let angle = (2 * 3.1415 / chat_users.length) * cnt;
        let w = action_window.offsetWidth;
        let h = action_window.offsetHeight;

        let x = Math.trunc(radius*Math.cos(angle));
        let y = Math.trunc(radius*Math.sin(angle));

        avatar.style.setProperty('position', 'absolute');
        avatar.style.setProperty('left', w/2 - (avatar.offsetWidth / 2) + 'px');
        avatar.style.setProperty('top', h/2 - (avatar.offsetHeight / 2) + 'px');
        avatar.style.setProperty('transform','translate3d('+x+'px,'+y+'px,0px)');
        avatar.style.setProperty('transition','transform .3s ease-in-out');
    }

    function Second_scene(data){
        let who_attacks = [-1,-1],str = data.message, who_defends;
        let attack_card = str[0] + (str[1] === ' ' ? '':str[1]);
        who_attacks[0] = Number((str[str.length - 2] === ' ' ? '':str[str.length - 2]) + str[str.length - 1]);
        who_defends = chat_users[next_to(who_attacks[0])].uid;
        who_attacks[1] = chat_users[next_to(who_defends)].uid;
        let window = document.getElementById('main-window');
        let w = window.offsetWidth, h = window.offsetHeight;
        let attacker_id_1 = document.getElementById('picture-'+NumInQueue(who_attacks[0]));
        let attacker_id_2 = document.getElementById('picture-'+NumInQueue(who_attacks[1]));
        let defender_id = document.getElementById('picture-'+NumInQueue(who_defends));
        // Inscription showing
        if(session.uid === who_attacks[0] || session.uid === who_attacks[1]){
            let out = '<p class="game-inscription">Attack '+chat_users[NumInQueue(who_defends)].name+'</p>';
            let text = document.getElementById('for-inscriptions');
            text.innerHTML = out;
            $(".game-inscription").fadeIn(500);
            setTimeout(function () {
                let temp = document.getElementById('inscription');
                $(".game-inscription").fadeOut(500);
            },1500);
        }
        if(session.uid === who_defends){
            let out = '<p class="game-inscription">Defend yourself</p>';
            let text = document.getElementById('for-inscriptions');
            text.innerHTML = out;
            $(".game-inscription").fadeIn(500);
            setTimeout(function () {
                let temp = document.getElementById('inscription');
                $(".game-inscription").fadeOut(500);
            },1500);
        }

        if(attacker_id_1 !== null){
            let x = attacker_id_1.offsetLeft, y = attacker_id_1.offsetTop, bias = attacker_id_1.offsetWidth;
            let bias_top = session.uid === who_defends ? -(y+h*0.05) : (h*0.75 - y);
            attacker_id_1.style.setProperty('transform','translate3d('
                +(w/2 - x - bias)+'px,'+(bias_top)+'px,0px)');
            attacker_id_1.style.setProperty('transition','transform .3s ease-in-out');
        }
        if(attacker_id_2 !== null && who_attacks[0] !== who_attacks[1]){
            let x = attacker_id_2.offsetLeft, y = attacker_id_2.offsetTop, bias = attacker_id_2.offsetWidth;
            let bias_top = session.uid === who_defends ? -(y+h*0.05) : (h*0.75 - y);
            attacker_id_2.style.setProperty('transform','translate3d('
                +(w/2 - x + bias)+'px,'+(bias_top)+'px,0px)');
            attacker_id_2.style.setProperty('transition','transform .3s ease-in-out');
        }
        if(defender_id !== null){
            let x = defender_id.offsetLeft, y = defender_id.offsetTop;
            let bias_top = session.uid === who_defends ? (h*0.75 - y) : -(y+h*0.05);
            defender_id.style.setProperty('transform','translate3d('+(w/2 - x)+'px,'+bias_top+'px,0px)');
            defender_id.style.setProperty('transition','transform .3s ease-in-out');
        }
    }
//------------------------------------------------------

//------ Message taking and showing functions ----------

    function TakeNewMessage(delete_last_char){
        let i = NumInQueue(session.uid);

        let newMessage = document.getElementById('text-line');

        if(newMessage.value === ''){
            newMessage.value = '';
            return;
        }

        var text = newMessage.value;
        if(delete_last_char) {
            text.substring(0, text.length - 2);
        }

        if(is_it_tag(newMessage.value, false)){
            text = is_it_tag(newMessage.value, true);
        }

        self._rpc({
            model: "pos.session",
            method: "send_field_updates",
            args: ['', text, 'Message', session.uid]
        });

        newMessage.value = '';
    }

    function showMessage(uid){
        var i = NumInQueue(uid), num = all_messages[i].length - 1;
        var cnt = messages_cnt[i]++;

        var mes_class = 'new-message-'+uid+'-'+cnt;
        all_messages[i][num].class = mes_class;
        var mes_id = 'single-message-'+uid+'-'+cnt;

        var message = document.getElementById('message-id-' + uid);
        if(typeof message === null) {
            return;
        }
        var out = '';

        if(num > 0){
            out += '<li id="single-message-'+uid+'-'+
            (cnt - 1)+'" class="new-message-'+uid+'-'+(cnt - 1)+ '">'+
            all_messages[i][num - 1].text+'</li>';
        }

        out += '<li id="'+mes_id+'" class="' + mes_class + '">'+
        all_messages[i][num].text+'</li>';

        out += '<audio src="/pos_durak/static/src/sound/msg.wav" autoplay="true"></audio>';

        message.innerHTML = out;
        if(num > 0){
            message_view('single-message-'+uid+'-'+(cnt - 1), false);
        }

        message_view(mes_id, true);
        $("."+mes_class).fadeIn();
        all_timeOuts[i].push(window.setTimeout(Disappear,15000, uid));
    }

    // Messages slow disapperaring
    function Disappear(uid){
        if(typeof all_messages[NumInQueue(uid)] === 'undefined') {return;}
        if(all_messages[NumInQueue(uid)].length === 0) {return;}
        $('.'+all_messages[NumInQueue(uid)][0].class).fadeOut();
        all_messages[NumInQueue(uid)].shift();
        all_timeOuts[NumInQueue(uid)].shift();
    }
//--------------------------------------------------

//---------Help functions part----------------------

    function message_view(message_id, display){
        single_message = document.getElementById(message_id);
        single_message.style.setProperty('border-radius', '20%');
        single_message.style.setProperty('background','white');
        single_message.style.setProperty('top','10px');
        single_message.style.setProperty('width','100px');
        single_message.style.setProperty('font','14pt sans-serif');
        if(display){
            single_message.style.setProperty('display', 'none');
        }
    }

    function CheckUserExists(uid){
        for(var i = 0; i < chat_users.length; i++){
            if(uid === chat_users[i].uid) return true;
        }
        return false;
    }

    function Push_new_message(i, uid, message){
        return all_messages[i].push({
            text: message,
            user_id : uid,
            class : 'new-message-'+uid+'-'+all_messages[i].length,
            cnt : -1
        });
    }
    // Users all data deletion
    function DeleteUserData(uid){
        var j = NumInQueue(uid);
        for(var i = j; i < chat_users.length; i++){
            chat_users[i] = chat_users[i + 1];
            all_messages[i] = all_messages[i + 1];
            all_timeOuts[i] = all_timeOuts[i + 1];
        }
        messages_cnt.pop();
        chat_users.pop();
        all_messages.pop();
        all_timeOuts.pop();
    }

    function DeleteMyData(){
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
        for(var i = 0; i < str.length; i++){
            if(left + right === 2 && str[i] !== '<'){
                text += str[i];
            }
            if(str[i] === '<')left++;
            if(str[i] === '>')right++;
            if(str[i] === '/') slash++;
        }
        // If send mode is active
        if(send) {
            return text;
        }

        if(left === 2 && right === 2 && slash === 1){
            return true;
        }
        else{
            return false;
        }
    }

    function next_to(uid){
        if(NumInQueue(uid) === chat_users.length - 1) return 0;
        else return NumInQueue(uid) + 1;
    }
//--------------------------------------------------

//--------------- Users relations part -----------------

    function AddNewMessage(data){
        var i = NumInQueue(data.uid);
        if(all_messages[i].length >= 2){
            clearTimeout(all_timeOuts[i][0]);
            Disappear(data.uid);
        }
        Push_new_message(i, data.uid, data.message);
        showMessage(data.uid);
    }

    function AddNewUser(user_data)
    {
        // If user connected too late
        if(game_started) return;

        chat_users.push({
            name : '',
            true_name : user_data.name,
            uid : user_data.uid,
            participate : false,
            allow_change_name: true,
            cards : []
        });

        all_messages.push([]);
        all_timeOuts.push([]);
        messages_cnt.push(0);
        if(user_data.uid === session.uid) {ShowUsers();return;}

        // Tell to new user about current user
        window.setTimeout(function(){
            var i = NumInQueue(session.uid);
            self._rpc({
                model: "pos.session",
                method: "send_all_user_data_to",
                args: [chat_users[i].name, chat_users[i].true_name,
                chat_users[i].participate, chat_users[i].allow_change_name,
                session.uid, 'Exist', user_data.uid]
            });
        }, 200 * NumInQueue(session.uid) + 1);

        if(in_chat)
        {
            ShowUsers();
        }
    }

    function AddExistUser(data){
        chat_users.push({
            name : data.name,
            true_name : data.true_name,
            uid : data.uid,
            participate : data.participate,
            allow_change_name: data.allow,
            cards : []
        });
        var n = chat_users.length;
        var temp = chat_users[n - 1];
        chat_users[n - 1] = chat_users[n - 2];
        chat_users[n - 2] = temp;

        all_messages.push([]);
        all_timeOuts.push([]);
        messages_cnt.push(0);

        ShowUsers();
    }

    function DeleteUser(user_id){
        let exist = false;
        chat_users.forEach(function (item) {
           if(item.uid === user_id) exist = true;
        });
        if(!exist) { return; }
        DeleteUserData(user_id);
        if(user_id !== session.uid){
            ShowUsers();
        }
    }

    function Distribute_cards(data, took_cards){
        if(took_cards){
            var ses = NumInQueue(session.uid);
            var str = data.message;
            for(var i = 0; i < str.length - 1; i++){
                var num = '';
                if(str[i] !== ' '){
                    if(str[i + 1] !== ' '){
                        chat_users[ses].cards.push(str[i] + str[i + 1]);
                        i++;
                    }
                    else
                        chat_users[ses].cards.push(str[i]);
                }
            }
            ShowCards();
        }
        else if(session.uid === chat_users[0].uid)
        {
            self._rpc({
                model: "pos.session",
                method: "distribution"
            });
        }
    }

    function SaveExtraCards(data){
        trump = data.name;
        var str = data.message;
        for(var i = 0; i < str.length - 1; i++){
            var num = '';
            if(str[i] !== ' '){
                if(str[i + 1] !== ' '){
                    beated.push(str[i] + str[i + 1]);
                    i++;
                }
                else
                    beated.push(str[i]);
            }
        }
    }

    function Move(card_num){
        if(who_moves === -1){
            who_moves = chat_users[0].uid;
        }
        else{
            who_moves = next_to(who_moves);
        }

        if(who_moves === session.uid || next_to(who_moves) === session.uid){
            self._rpc({
                model: "pos.session",
                method: "Moved",
                args: [session.uid, card_num]
            });
        }
        else{
            alert('Not so fast, its not your turn!');
        }
    }

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
            if(!in_chat){
                return;
            }
            var self = this;
            // If someone connected to the chat
            if(data.command === 'Connect'){
                if(!CheckUserExists(data.uid)){
                    AddNewUser(data);
                }
            }
            else if(data.command === 'Disconnect'){
                DeleteUser(data.uid);
            }
            else if(data.command === 'Message'){ // If someone throwed a message
                AddNewMessage(data);
            }
            else if(data.command === 'Exist'){
                    AddExistUser(data);
            }
            else if(data.command === 'game_started'){
                game_started = true;
                Distribute_cards(data, false);
            }
            else if(data.command === 'Cards'){
                Distribute_cards(data, true);
            }
            else if(data.command === 'Extra'){
                SaveExtraCards(data);
            }
            else if(data.command === 'Move'){
                attacking = true;
                Second_scene(data);
            }
        },
    });
//------------------------------------------------------
    return ChatButton;
});
