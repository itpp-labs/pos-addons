odoo.define('pos_chat_button', function (require){
      'use_strict';

    var gui = require('point_of_sale.gui');
    var screens = require('point_of_sale.screens');
    var session = require('web.session');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

//-------------------- Variables -----------------------

    // All users messages stored here
     all_messages = [];
    // Messages timeouts needs to store,
    // cause only this way we can know when to delete the m
    var all_timeOuts = [];
    // Information about every user
    var chat_users = [];
    // I don't remember why i added this,
    // but without it, app don't work:D
    var messages_cnt = [];
    // Are user in chat room right now
    var in_chat = false;
    // Full channel name
    var channel = "pos_chat";
    // Shows game stage
    var game_started = false;
    // Beated cards
    var beated = [];
    // Donald Trump
    var trump = '';
    // who moves
    var who_moves = 0;
    // Game mode
    var attacking = false;
    var W = 0;
    var H = 0;
    // On table cards
    var on_table_cards = [];
    var complete_move = 0;
    // How much cards on the table
    var moves_cnt = 0;
    // Cards max count
    var max_cards = 7;
    // Defender counter
    var choose_and_beat = 0;
    var def_cards = [0,0];
    var all_cards = [];
    var last_moved_card = -1;
    var extra_cards = [];
    var temp_extra_cards = [];
    var card_suits = ['Heart', 'Diamond', 'Clubs', 'Spade'];

//------------------------------------------------------

//--------------- Game table actions -------------------

    function Defendence(x, y) {
        var ans = Comp(def_cards[0], def_cards[1]);
        if(ans === 2){
            alert('Your card is weaker!');
        }
        else if(ans === -1){
            alert('This cards are different suits!')
        }
        else if(ans === 1){
            self._rpc({
                model: "pos.session",
                method: "defend",
                args: [session.uid, def_cards[0], def_cards[1], x, y]
            });
        }

        def_cards = [0,0];
    }

    function Take_Cards() {
        // Need to finish
        var temp_cards = '';
        for(var i = 0; i < on_table_cards.length; i++){
            temp_cards += on_table_cards[i] + ' ';
        }
        self._rpc({
            model: "pos.session",
            method: "take_cards",
            args: [session.uid, temp_cards]
        });
    }

//------------------------------------------------------

//-------------Help functions part----------------------
    // Checks out which num user has
    function NumInQueue(uid){
        for(var i = 0; i < chat_users.length; i++){
            if(chat_users[i].uid === uid) {
                return i;
            }
        }
    }

    function OnTable(n) {
        for(var i = 0; i < on_table_cards.length; i++){
            if(on_table_cards[i] === n) {
                return true;
            }
        }
        return false;
    }

    function ControlOnClick(e) {
        var elem = e ? e.target : window.event.srcElement;
        if(elem.id[0]+elem.id[1]+elem.id[2]+elem.id[3] === 'card'){
           var num = '';
           if(elem.id[elem.id.length - 2] !== '-') num = elem.id[elem.id.length - 2];
           num += elem.id[elem.id.length - 1];
           if(session.uid === next_to(who_moves, true)){
               if(!OnTable(num) && choose_and_beat > 0){
                   return;
               }
               choose_and_beat++;
               def_cards[choose_and_beat - 1] = num;
               if(choose_and_beat === 2){
                   choose_and_beat = 0;
                   Defendence(e.pageX/W, e.pageY/H);
               }
           }
           else{
               Move(num);
           }
        }
        else if(elem.id === "ready-button"){
            self._rpc({
                model: "pos.session",
                method: "game_started",
                args: [session.uid, chat_users.length]
            });
        }
        else if(elem.id === "step-button"){
            self._rpc({
               model: 'pos.session',
               method: 'send_field_updates',
               args: ['','','Move_done',session.uid]
            });
        }
        else if(elem.id === "take-button"){
            Take_Cards();
        }
        else if(elem.id[0]+elem.id[1]+elem.id[2] === "ava" && game_started){
            var num = (elem.id[elem.id.length - 2] !== '-' ? elem.id[elem.id.length - 2] : '')
                + elem.id[elem.id.length - 1];
            HowMuchCards(chat_users[Number(num)].uid);
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
            W = document.getElementById('main-window').offsetWidth;
            H = document.getElementById('main-window').offsetHeight;
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
                ControlOnClick(e);
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

//--------------- Game table actions -------------------

    function Tip(str, how_long_to_hold, delay){
        var text = document.getElementById('for-inscriptions');
        text.innerHTML = str;
        $(".tips").fadeIn(delay);

        text.style.setProperty('transform','translate3d(0px,'+(H/2 - text.offsetTop)+'px,0px)');
        setTimeout(function () {
        text.style.setProperty('transform','translate3d(0px,'+(H*3 - text.offsetTop)+'px,0px)');
        },how_long_to_hold);

        setTimeout(function () {
            $(".tips").fadeOut(delay);
            text.style.setProperty('top', '0');
        },how_long_to_hold + 1000);
    }

    function Card_power(card_num) {
        var n = Number(card_num);
        var cnt = 0;
        while(n >= 13){
            n -= 13;
            cnt++;
        }
        return [n === 0 ? 13 : n, cnt];
    }

    function Comp(card_num1, card_num2){
        var card1 = Card_power(card_num1);
        var card2 = Card_power(card_num2);
        card1[0] = (card1[1] === trump[1]) ? (card1[0] + 100) : card1[0];
        card2[0] = (card2[1] === trump[1]) ? (card2[0] + 100) : card2[0];
        if (card1[1] === card2[1] || card1[1] === trump[1] || card2[1] === trump[1]){
            return card1[0] > card2[0] ? 1 : 2;
        }
        return -1;
    }

    function PutOn(card) {
        var sign = (moves_cnt + 1)%2 === 0 ? 1 : -1;
        var cw = card.offsetWidth, ch = card.offsetHeight;

        var put_w = (W - cw)/2 + moves_cnt*cw*sign*0.5, put_h = (H - ch)/2;
        var x = card.offsetLeft, y = card.offsetTop;
        card.style.setProperty('opacity','1');
        card.style.setProperty('transform','translate3d('
            +(put_w - x)+'px,'+(put_h - y)+'px,0px)');
        card.style.left = x;card.style.top = y;
    }

    function Cover(card, x2, y2) {
        var card1 = document.getElementById('card-'+card);
        var x1 = card1.offsetLeft, y1 = card1.offsetTop;
        var w = card1.offsetWidth, h = card1.offsetHeight;
        card1.style.setProperty('transform','translate3d('+
            (x2*W - w/2 - x1)+'px,'+(y2*H - h/2 - y1)+'px,0px)');
    }

    function Move(card_num){
        // Need to check suit of card, and make a decide
        // Can player make a step or no
        if(attacking){
            if(Card_power(card_num)[1] !== Card_power(last_moved_card)[1]){
                alert('Card suit should be - '+ card_suits[Card_power(last_moved_card)[1]]);
                return;
            }
        }
        if(moves_cnt >= max_cards){
            alert('You can step only '+max_cards+' times!');
            return;
        }
        var stepper = [chat_users[who_moves].uid,
            next_to(next_to(who_moves, true),false)];
        if(stepper[0] === session.uid){
            self._rpc({
                model: "pos.session",
                method: "moved",
                args: [session.uid, card_num]
            });
        }
        else if(stepper[1] === session.uid && attacking){
            self._rpc({
                model: "pos.session",
                method: "moved",
                args: [session.uid, card_num]
            });
        }
        else{
            alert('Not so fast, its not your turn!');
        }
    }

    function HowMuchCards(uid){
        self._rpc({
            model: "pos.session",
            method: 'number_of_cards',
            args: [uid, session.uid]
        });
    }

    function ShowHowMuchCards(num){
        Tip(num, 1500, 500);
    }

    function DownloadEnemyCards(n, user){
        for(var i = 0; i < all_cards.length; i++){
            if(n === all_cards[i]) return;
        }
        all_cards.push(n);
        chat_users[NumInQueue(user)].cards.push(n);
        var out ='<img type="button" src="/pos_durak/static/src/img/kards/'+
                n+'.png" id="card-'+n+'" class="enemy-card"/>';
        document.getElementById('enemy-cards').innerHTML += out;
    }

    function DeleteCard(n, who){
        for(var i = 0; i < chat_users[who].cards.length; i++){
            if(n === chat_users[who].cards[i]){
                chat_users[who].cards.splice(i,1);
            }
        }
        on_table_cards.push(n);
        if(session.uid === chat_users[who].uid){
            self._rpc({
                model: "pos.session",
                method: "send_field_updates",
                args: ['', '', 'DeleteExtraCard', chat_users[who].uid]
            });
        }
    }

    function First_scene(){
        var i;
        attacking = false;
        complete_move = 0;
        moves_cnt = 0;
        for(i = 0; i < on_table_cards.length; i++){
            var card = document.getElementById('card-'+on_table_cards[i]);
            card.style.setProperty('opacity', '0');
        }
        while(on_table_cards.length > 0){
            on_table_cards.shift();
        }
        for(i = 0; i < chat_users.length; i++){
            document.getElementById('picture-'+i).
            style.setProperty('opacity','1');
        }
        document.getElementById('step-button').style.setProperty('opacity', '0');
        document.getElementById('take-button').style.setProperty('opacity','0');
        if(in_chat){
            ShowUsers();
        }
        who_moves = NumInQueue(next_to(who_moves, true));
    }

    function Second_scene(data, who_attacking){
        document.getElementById('ready-button').style.setProperty('display', 'none');
        var who_attacks = [who_attacking, -1];
        var who_defends;
        who_defends = next_to(who_attacks[0], false);
        who_attacks[1] = next_to(who_defends, false);
        if(who_attacks[0] === session.uid || who_attacks[1] === session.uid){
            document.getElementById('step-button').style.setProperty('opacity', '1');
        }
        // Hode other players
        for(var i = 0; i < chat_users.length; i++){
            var temp = chat_users[i].uid;
            if(temp !== who_attacks[0] && temp !== who_attacks[1]
            && temp !== who_defends){
                document.getElementById('picture-'+i).
                style.setProperty('opacity','0');
            }
        }
        var attacker_id_1 = document.getElementById('picture-'+NumInQueue(who_attacks[0]));
        var attacker_id_2 = document.getElementById('picture-'+NumInQueue(who_attacks[1]));
        var defender_id = document.getElementById('picture-'+NumInQueue(who_defends));
        // Inscription showing
        if(session.uid === who_attacks[0] || session.uid === who_attacks[1]){
            Tip('Attack'+String(chat_users[NumInQueue(who_defends)].name), 2000, 500);
        }
        if(session.uid === who_defends){
            var button = document.getElementById('take-button');
            button.style.setProperty('opacity','1');
            Tip('Defend yourself', 2000, 500);
        }

        var x, y, bias, bias_top;
        if(attacker_id_1 !== null){
            x = attacker_id_1.offsetLeft, y = attacker_id_1.offsetTop, bias = attacker_id_1.offsetWidth;
            bias_top = session.uid === who_defends ? -(y+H*0.05) : (H*0.75 - y);
            attacker_id_1.style.setProperty('transform','translate3d('
                +(W/2 - x - bias)+'px,'+(bias_top)+'px,0px)');
            attacker_id_1.style.setProperty('transition','transform .3s ease-in-out');
        }
        if(attacker_id_2 !== null && who_attacks[0] !== who_attacks[1]){
            x = attacker_id_2.offsetLeft, y = attacker_id_2.offsetTop, bias = attacker_id_2.offsetWidth;
            bias_top = session.uid === who_defends ? -(y+H*0.05) : (H*0.75 - y);
            attacker_id_2.style.setProperty('transform','translate3d('
                +(W/2 - x + bias)+'px,'+(bias_top)+'px,0px)');
            attacker_id_2.style.setProperty('transition','transform .3s ease-in-out');
        }
        if(defender_id !== null){
            x = defender_id.offsetLeft, y = defender_id.offsetTop;
            bias_top = session.uid === who_defends ? (H*0.75 - y) : -(y+H*0.05);
            defender_id.style.setProperty('transform','translate3d('
                +(W/2 - x)+'px,'+bias_top+'px,0px)');
            defender_id.style.setProperty('transition','transform .3s ease-in-out');
        }
    }
//------------------------------------------------------

//---------- Set avatar and animation part -------------
    function ShowCards(){
        var block = document.getElementById('cards');
        var me = NumInQueue(session.uid);
        var out = '', w = (60/chat_users[me].cards.length)/2;
        for(var i = 0; i < chat_users[me].cards.length; i++){
            var n = chat_users[me].cards[i];
            out+='<img type="button" src="/pos_durak/static/src/img/kards/'+
            n+'.png" id="card-'+n+'" class="card" style="right: '+(30 - i*w)+'%"/>';
        }
        block.innerHTML = out;
    }

    function ShowUsers(){
        var window = document.getElementById('main-window');
        var out = '';
        chat_users.forEach(function (item){
            var i = NumInQueue(item.uid);
            out += '<div class="chat-user-'+item.uid+'" id="picture-'+i+'">';
            out += '<div class="user-name" id="user-name-'+item.uid+'">'+chat_users[i].true_name+'</div>';
            out += '<img src="/web/image/res.users/' +
            item.uid + '/image_small" id="ava-' + i +'" class="avatar" style="border-radius:50%;"/>';

            out += '<ul class="new-message" id="message-id-'+item.uid+'"></ul>';
            out += '</div>';
        });
        window.innerHTML = out;

        chat_users.forEach(function(item){
            SetPos(document.getElementById('picture-'+NumInQueue(item.uid)), item.uid);
        });
    }

    function SetPos(avatar, uid){
        var cnt = NumInQueue(uid) + 1;
        var angle = (2 * 3.1415 / chat_users.length) * cnt;
        var radius = Math.min(W*0.7,H*0.7)/2;
        var x = Math.trunc(radius*Math.cos(angle));
        var y = Math.trunc(radius*Math.sin(angle));

        avatar.style.setProperty('position', 'absolute');
        avatar.style.setProperty('left', W/2 - (avatar.offsetWidth / 2) + 'px');
        avatar.style.setProperty('top', H*0.4 - (avatar.offsetHeight / 2) + 'px');
        avatar.style.setProperty('transform','translate3d('+x+'px,'+y+'px,0px)');
        avatar.style.setProperty('transition','transform .3s ease-in-out');
    }
//------------------------------------------------------

//------ Message taking and showing functions ----------

    function TakeNewMessage(delete_last_char){
        var i = NumInQueue(session.uid);

        var newMessage = document.getElementById('text-line');

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
        var single_message = document.getElementById(message_id);
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
        game_started = false;
        document.getElementById('enemy-cards').innerHTML = '';
        document.getElementById('cards').innerHTML = '';
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

        return left === 2 && right === 2 && slash === 1 ? true : false;
    }

    function next_to(num, already_converted){
        var i = already_converted ? num : NumInQueue(num);
        return i === chat_users.length - 1 ?
            chat_users[0].uid : chat_users[i + 1].uid;
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

        if(in_chat){
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
        var exist = false;
        chat_users.forEach(function (item) {
           if(item.uid === user_id) {
               exist = true;
           }
        });
        if(!exist) {
            return;
        }
        DeleteUserData(user_id);
        if(user_id !== session.uid){
            ShowUsers();
        }
    }

    function Distribute_cards(data, took_cards){
        var ses = NumInQueue(session.uid);
        while(chat_users[ses].cards.length > 0){
            chat_users[ses].cards.shift();
        }
        if(took_cards){
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
                method: "cards_distribution"
            });
        }
    }

    function SaveExtraCards(data){
        trump = Card_power(data.name);
        var str = data.message;
        for(var i = 0; i < str.length - 1; i++){
            var num = '';
            if(str[i] !== ' '){
                if(str[i + 1] !== ' '){
                    extra_cards.push(str[i] + str[i + 1]);
                    i++;
                }
                else
                    extra_cards.push(str[i]);
            }
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
                if(chat_users[NumInQueue(session.uid)].cards.length === 0){
                    self._rpc({
                        model: "pos.session",
                        method: "resent_cards",
                        args: [session.uid]
                    });
                }
            }
            else if(data.command === 'Extra'){
                SaveExtraCards(data);
                // Show suit
                var temp_window = document.getElementById('main-window');
                temp_window.innerHTML += '<img type="button" src="/pos_durak/static/src/img/'+
                    card_suits[trump[1]]+'.png" id="suit" style=";' +
                    'position:absolute;left:40%;top:40%;opacity: 0.2;"/>'
            }
            else if(data.command === 'Move'){
                moves_cnt++;
                var str = data.message;
                var who_attacks = Number((str[str.length - 2] === ' ' ? '':str[str.length - 2]) + str[str.length - 1]);
                if(!attacking){
                    Second_scene(data, who_attacks);
                    Tip('If defender beated cards, press "Complete move")', 4000, 400);
                }
                attacking = true;
                var attack_card = str[0] + (str[1] === ' ' ? '':str[1]);
                last_moved_card = attack_card;
                if(who_attacks !== session.uid){
                    DownloadEnemyCards(attack_card, who_attacks);
                }
                var card = document.getElementById('card-'+attack_card);
                PutOn(card);
                DeleteCard(attack_card, NumInQueue(who_attacks));
            }
            else if(data.command === 'HowMuchCards'){
                ShowHowMuchCards(data.message)
            }
            else if(data.command === 'Move_done'){
                complete_move++;
                if(complete_move === 2 && chat_users.length > 2 ||
                complete_move === 1 && chat_users.length === 2){
                    // Take new cards
                    var temp = NumInQueue(session.uid);
                    for(var i = 0; i < temp_extra_cards.length; i++){
                        chat_users[temp].cards.push(temp_extra_cards[i]);
                    }
                    while(temp_extra_cards.length > 0){
                        temp_extra_cards.shift();
                    }
                    First_scene();
                    ShowCards();
                }
            }
            else if(data.command === 'Defense'){
                var card1 = data.first, card2 = data.second;
                if(data.uid !== session.uid){
                    DownloadEnemyCards(card1, data.uid);
                    DownloadEnemyCards(card2, data.uid);
                }
                if(!OnTable(card1)){
                    on_table_cards.push(card1);
                }
                if(!OnTable(card2)){
                    on_table_cards.push(card2);
                }
                Cover(card1, data.x, data.y);
                beated.push(card1, card2);
                DeleteCard(card1, NumInQueue(data.uid));
            }
            else if(data.command === 'Loser'){
                First_scene();
                // who_moves === session.uid, cause in 'First_scene' method
                // we appropriated who_moves = next_to(who_moves)
                if(chat_users[who_moves].uid === session.uid){
                    Distribute_cards(data, true);
                }
                who_moves = NumInQueue(next_to(who_moves, true));
            }
            else if(data.command === 'DeleteExtraCard'){
                if(extra_cards.length === 0){
                    return;
                }

                if(chat_users[NumInQueue(data.uid)].cards.length < max_cards){
                    if(session.uid === data.uid){
                        temp_extra_cards.push(extra_cards[0]);
                    }
                    extra_cards.shift();
                }
            }
        },
    });
//------------------------------------------------------
    return ChatButton;
});
