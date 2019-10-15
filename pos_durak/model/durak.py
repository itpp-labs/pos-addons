import random
import re
from odoo import models, fields, api, _

class Durak(models.Model):
    _inherit = 'pos.session'

    # def default_game_id(self):
    #     return self.env.ref('base_game')

    plays = fields.Boolean(default=False)
    cards = fields.Text(default='')
    cards_num = fields.Integer(default=0)
    # game_id = fields.Many2one('game', default=default_game_id)

    @api.model
    def send_field_updates(self, name, message, command, uid):
        channel_name = "pos_chat"
        if command == "Disconnect":
            self.search([("user_id", "=", uid)]).write({'plays': False, 'cards': ''})
        data = {'name': name, 'message': message, 'uid': uid, 'command': command}
        self.env['pos.config'].send_to_all_poses(channel_name, data)
        return 1

    @api.model
    def send_to_user(self, command, message, pos_id):
        data = {'command': command, 'message': message}
        channel = self.env['pos.config']._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
        self.env['bus.bus'].sendmany([[channel, data]])
        return 1

    @api.model
    def send_all_user_data_to(self, name, true_name, participate, allow, from_uid, command, to_uid):
        data = {'name': name, 'true_name': true_name, 'participate': participate, 'allow': allow,
                'uid': from_uid, 'command': command}
        pos_id = self.search([('state', '=', 'opened'), ('user_id', '=', to_uid)], limit=1).id
        channel = self.env['pos.config']._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
        self.env['bus.bus'].sendmany([[channel, data]])
        return 1

    @api.model
    def game_started(self, uid, max_users):
        pos_id = self.search([('user_id', '=', uid)]).id
        self.search([("id", "=", pos_id)]).write({
            'plays': True
        })
        cnt = len(self.search([("plays", "=", True)]))
        if cnt > 7:
            return 1
        if cnt >= max_users or cnt == 7:
            self.send_field_updates("", "", "game_started", -1)
        return 1

    @api.model
    def card_power(self, card_num):
        card = int(card_num)
        cnt = 0
        while card < 13:
            card -= 13
            cnt += 1
        return [card, cnt]

    @api.model
    def cards_distribution(self):
        players = self.search([('plays', '=', True)])
        seq = [*range(0, 52)]
        how_much_cards = 7
        random.shuffle(seq)
        card_nums = []
        i = 0
        for num in seq:
            card_nums.append(num)
            if len(card_nums) == how_much_cards:
                temp_str = ""
                for j in card_nums:
                    temp_str += str(j)
                    temp_str += ' '
                card_nums.clear()
                players[i].write({
                    'cards': temp_str,
                    'cards_num': 7
                })
                self.send_to_user('Cards', temp_str, players[i].id)
                i += 1
            if(i >= len(players)):
                break
        temp_str = ''
        for k in range(len(players)*how_much_cards - 1, len(seq) - 2):
            temp_str += str(seq[k]) + ' '
        self.send_field_updates(str(seq[len(seq) - 1]),
                                temp_str, "Extra", -1)

        # self.game_id.trump = self.CardPower(str(seq[len(seq) - 1]))[1]
        return 1

    @api.model
    def delete_card(self, uid, card):
        user = self.search([('user_id', '=', uid)])
        user.write({
            'cards': re.sub(card + " ", "", user.cards),
        })
        return 1

    @api.model
    def moved(self, from_uid, card):
        user = self.search([('user_id', '=', from_uid)])
        cards_cnt_before = len(user.cards)

        self.delete_card(user, card)
        if len(user.cards) == cards_cnt_before:
            return 1
        user.write({'cards_num': user.cards_num - 1})
        self.send_field_updates('', card + " " + str(from_uid), 'Move', from_uid)
        return 1

    @api.model
    def number_of_cards(self, uid, from_uid):
        self.send_to_user('HowMuchCards',
                          str(self.search([('user_id', '=', uid)]).cards_num),
                          self.search([('user_id', '=', from_uid)]).id)
        return 1

    @api.model
    def defend(self, uid, card1, card2, x, y):
        data = {'uid': uid, 'first': card1, 'second': card2, 'command': 'Defense', 'x': x, 'y': y}
        for pos in self.search([('plays', '=', True)]):
            channel = self.env['pos.config']._get_full_channel_name_by_id(self.env.cr.dbname, pos.id, "pos_chat")
            self.env['bus.bus'].sendmany([[channel, data]])
        return 1

    @api.model
    def send_cards(self, uid):
        cards = self.filtered(lambda el: el.user_id == uid).cards
        self.send_to_user("Cards", cards, self.search([('user_id', '=', uid)]).id)
        return 1

    @api.model
    def take_cards(self, uid, cards):
        user = self.search([('user_id', '=', uid)])
        user.write({
            'cards': user.cards + ' ' + cards
        })
        return 1
