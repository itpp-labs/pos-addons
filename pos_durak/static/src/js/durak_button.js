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
    // cause only this way we can know when to delete the m
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
    let who_moves = 0;
    // Game mode
    let attacking = false;
    let W = 0;
    let H = 0;
    // On table cards
    let on_table_cards = [];
    let complete_move = 0;
    // How much cards on the table
    let moves_cnt = 0;
    // Cards max count
    let max_cards = 7;
    // Defender counter
    let choose_and_beat = 0;
    let def_cards = [0,0];
    let all_cards = [];

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

    function is_on_table_card(num) {
        on_table_cards.forEach(function (item) {
            if(item === num) return true;
        });
        return false;
    }

    function ControlOnClick(e) {
        let elem = e ? e.target : window.event.srcElement;
        if(elem.id[0]+elem.id[1]+elem.id[2]+elem.id[3] === 'card'){
           let num = '';
           if(elem.id[elem.id.length - 2] !== '-') num = elem.id[elem.id.length - 2];
           num += elem.id[elem.id.length - 1];
           if(session.uid === next_to(who_moves, true)){
               // if(!is_on_table_card(num)){
               //     return;
               // }
               choose_and_beat++;
               def_cards[choose_and_beat - 1] = num;
               if(choose_and_beat === 2){
                   choose_and_beat = 0;
                   Defendence(e.pageX, e.pageY);
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
        else if(elem.id[0]+elem.id[1]+elem.id[2] === "ava" && game_started){
            let num = (elem.id[elem.id.length - 2] !== '-' ? elem.id[elem.id.length - 2] : '')
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
        let text = document.getElementById('for-inscriptions');
        text.innerHTML = str;
        $(".tips").fadeIn(delay);

        text.style.setProperty('transform','translate3d(0px,'+(H/2 - text.offsetTop)+'px,0px)');
        setTimeout(function () {
        text.style.setProperty('transform','translate3d(0px,'+(H*3 - text.offsetTop)+'px,0px)');
        },1000);

        setTimeout(function () {
            $(".tips").fadeOut(delay);
            text.style.setProperty('top', '0');
        },how_long_to_hold + 1000);
    }

    function Card_power(card_num) {
        let n = Number(card_num);
        let cnt = 0;
        while(n >= 13){
            n -= 13;
            cnt++;
        }
        return [n === 0 ? 13 : n, cnt];
    }

    function Comp(card_num1, card_num2){
        let card1 = Card_power(card_num1);
        let card2 = Card_power(card_num2);
        card1[0] = (card1[1] === trump[1]) ? (card1[0] + 100) : card1[0];
        card2[0] = (card2[1] === trump[1]) ? (card2[0] + 100) : card2[0];
        if (card1[1] === card2[1] || card1[1] === trump[1] || card2[1] === trump[1]){
            return card1[0] > card2[0] ? 1 : 2;
        }
        return -1;
    }

    function PutOn(card, who_attacks) {
        let sign = (moves_cnt + 1)%2 === 0 ? 1 : -1;
        let cw = card.offsetWidth, ch = card.offsetHeight;

        let put_w = (W - cw)/2 + moves_cnt*cw*sign*0.5, put_h = (H - ch)/2;
        let x = card.offsetLeft, y = card.offsetTop;
        card.style.setProperty('opacity','1');
        card.style.setProperty('transform','translate3d('
            +(put_w - x)+'px,'+(put_h - y)+'px,0px)');
        card.style.left = x;card.style.top = y;
    }

    function Cover(card, x2, y2) {
        let card1 = document.getElementById('card-'+card);
        let x1 = card1.offsetLeft, y1 = card1.offsetTop;
        let w = card1.offsetWidth, h = card1.offsetHeight;
        card1.style.setProperty('transform','translate3d('
            +(x2 - w/2 - x1)+'px,'+(y2 - h/2 - y1)+'px,0px)');
    }

    function Move(card_num){
        // Need to check suit of card, and make a decide
        // Can player make a step or no
        if(moves_cnt >= max_cards){
            alert('You can step only '+max_cards+' times!');
            return;
        }
        let stepper = [chat_users[who_moves].uid,
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
        for(let i = 0; i < all_cards.length; i++){
            if(n === all_cards[i]) return;
        }
        all_cards.push(n);
        chat_users[NumInQueue(user)].cards.push(n);
        let out ='<img type="button" src="/pos_durak/static/src/img/kards/'+
                n+'.png" id="card-'+n+'" class="enemy-card"/>';
        document.getElementById('enemy-cards').innerHTML += out;
    }

    function DeleteCard(n, who){
        for(let i = 0; i < chat_users[who].cards.length; i++){
            if(n === chat_users[who].cards[i]){
                chat_users[who].cards.splice(i,1);
            }
        }
    }

    function Defendence(x, y) {
        let ans = Comp(def_cards[0], def_cards[1]);
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

    function First_scene(){
        attacking = false;
        complete_move = 0;
        moves_cnt = 0;
        for(let i = 0; i < on_table_cards.length; i++){
            let card = document.getElementById('card-'+on_table_cards[i]);
            card.style.setProperty('opacity', '0');
        }
        for(let i = 0; i < chat_users.length; i++){
            document.getElementById('picture-'+i).
            style.setProperty('opacity','1');
        }
        document.getElementById('step-button').style.setProperty('opacity', '0');
        if(in_chat){
            ShowUsers();
        }
    }

    function Second_scene(data, who_attacking){
        document.getElementById('ready-button').style.setProperty('display', 'none');
        let who_attacks = [who_attacking, -1], who_defends;
        who_defends = next_to(who_attacks[0], false);
        who_attacks[1] = next_to(who_defends, false);
        if(who_attacks[0] === session.uid || who_attacks[1] === session.uid){
            document.getElementById('step-button').style.setProperty('opacity', '1');
        }
        // Hode other players
        for(let i = 0; i < chat_users.length; i++){
            let temp = chat_users[i].uid;
            if(temp !== who_attacks[0] && temp !== who_attacks[1]
            && temp !== who_defends){
                document.getElementById('picture-'+i).
                style.setProperty('opacity','0');
            }
        }
        let attacker_id_1 = document.getElementById('picture-'+NumInQueue(who_attacks[0]));
        let attacker_id_2 = document.getElementById('picture-'+NumInQueue(who_attacks[1]));
        let defender_id = document.getElementById('picture-'+NumInQueue(who_defends));
        // Inscription showing
        if(session.uid === who_attacks[0] || session.uid === who_attacks[1]){
            Tip('Attack'+String(chat_users[NumInQueue(who_defends)].name), 2000, 500);
        }
        if(session.uid === who_defends){
            Tip('Defend yourself', 2000, 500);
        }

        if(attacker_id_1 !== null){
            let x = attacker_id_1.offsetLeft, y = attacker_id_1.offsetTop, bias = attacker_id_1.offsetWidth;
            let bias_top = session.uid === who_defends ? -(y+H*0.05) : (H*0.75 - y);
            attacker_id_1.style.setProperty('transform','translate3d('
                +(W/2 - x - bias)+'px,'+(bias_top)+'px,0px)');
            attacker_id_1.style.setProperty('transition','transform .3s ease-in-out');
        }
        if(attacker_id_2 !== null && who_attacks[0] !== who_attacks[1]){
            let x = attacker_id_2.offsetLeft, y = attacker_id_2.offsetTop, bias = attacker_id_2.offsetWidth;
            let bias_top = session.uid === who_defends ? -(y+H*0.05) : (H*0.75 - y);
            attacker_id_2.style.setProperty('transform','translate3d('
                +(W/2 - x + bias)+'px,'+(bias_top)+'px,0px)');
            attacker_id_2.style.setProperty('transition','transform .3s ease-in-out');
        }
        if(defender_id !== null){
            let x = defender_id.offsetLeft, y = defender_id.offsetTop;
            let bias_top = session.uid === who_defends ? (H*0.75 - y) : -(y+H*0.05);
            defender_id.style.setProperty('transform','translate3d('
                +(W/2 - x)+'px,'+bias_top+'px,0px)');
            defender_id.style.setProperty('transition','transform .3s ease-in-out');
        }
    }
//------------------------------------------------------

//---------- Set avatar and animation part -------------
    function ShowCards(){
        let block = document.getElementById('cards');
        let me = NumInQueue(session.uid);
        let out = '', w = (60/chat_users[me].cards.length)/2;
        for(let i = 0; i < chat_users[me].cards.length; i++){
            let n = chat_users[me].cards[i];
            out+='<img type="button" src="/pos_durak/static/src/img/kards/'+
            n+'.png" id="card-'+n+'" class="card" style="right: '+(30 - i*w)+'%"/>';
        }
        block.innerHTML = out;
    }

    function ShowUsers(){
        let window = document.getElementById('main-window');
        let out = '';
        chat_users.forEach(function (item){
            let i = NumInQueue(item.uid);
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
        let cnt = NumInQueue(uid) + 1;
        let angle = (2 * 3.1415 / chat_users.length) * cnt;
        let radius = Math.min(W*0.7,H*0.7)/2;
        let x = Math.trunc(radius*Math.cos(angle));
        let y = Math.trunc(radius*Math.sin(angle));

        avatar.style.setProperty('position', 'absolute');
        avatar.style.setProperty('left', W/2 - (avatar.offsetWidth / 2) + 'px');
        avatar.style.setProperty('top', H*0.4 - (avatar.offsetHeight / 2) + 'px');
        avatar.style.setProperty('transform','translate3d('+x+'px,'+y+'px,0px)');
        avatar.style.setProperty('transition','transform .3s ease-in-out');
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

        let text = newMessage.value;
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
        let i = NumInQueue(uid), num = all_messages[i].length - 1;
        let cnt = messages_cnt[i]++;

        let mes_class = 'new-message-'+uid+'-'+cnt;
        all_messages[i][num].class = mes_class;
        let mes_id = 'single-message-'+uid+'-'+cnt;

        let message = document.getElementById('message-id-' + uid);
        if(typeof message === null) {
            return;
        }
        let out = '';

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
        let single_message = document.getElementById(message_id);
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
        for(let i = 0; i < chat_users.length; i++){
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
        let j = NumInQueue(uid);
        for(let i = j; i < chat_users.length; i++){
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
    }
    // Is this string the tag checking
    function is_it_tag(str, send)
    {
        let left = 0, right = 0, slash = 0;
        let text = '';
        for(let i = 0; i < str.length; i++){
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
        let i = already_converted ? num : NumInQueue(num);
        return i === chat_users.length - 1 ?
            chat_users[0].uid : chat_users[i + 1].uid;
    }
//--------------------------------------------------

//--------------- Users relations part -----------------

    function AddNewMessage(data){
        let i = NumInQueue(data.uid);
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
            let i = NumInQueue(session.uid);
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
        const n = chat_users.length;
        const temp = chat_users[n - 1];
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
        if(took_cards){
            let ses = NumInQueue(session.uid);
            let str = data.message;
            for(let i = 0; i < str.length - 1; i++){
                let num = '';
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
        let str = data.message;
        for(let i = 0; i < str.length - 1; i++){
            let num = '';
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
                moves_cnt++;
                let str = data.message;
                let who_attacks = Number((str[str.length - 2] === ' ' ? '':str[str.length - 2]) + str[str.length - 1]);
                if(!attacking){
                    Second_scene(data, who_attacks);
                }
                attacking = true;
                let attack_card = str[0] + (str[1] === ' ' ? '':str[1]);
                if(who_attacks !== session.uid){
                    DownloadEnemyCards(attack_card, who_attacks);
                }
                let card = document.getElementById('card-'+attack_card);
                PutOn(card, who_attacks);
                DeleteCard(attack_card, NumInQueue(who_attacks));
                on_table_cards.push(attack_card);
            }
            else if(data.command === 'HowMuchCards'){
                ShowHowMuchCards(data.message)
            }
            else if(data.command === 'Move_done'){
                complete_move++;
                if(complete_move === 2){
                    First_scene();
                    who_moves = NumInQueue(next_to(who_moves, true));
                }
            }
            else if(data.command === 'Defense'){
                let card1 = data.first, card2 = data.second;
                if(data.uid !== session.uid){
                    DownloadEnemyCards(card1, data.uid);
                    DownloadEnemyCards(card2, data.uid);
                }
                Cover(card1, data.x, data.y);
                beated.push(card1);
                beated.push(card2);
            }
        },
    });
//------------------------------------------------------
    return ChatButton;
});
