import random
import re
from odoo import models, fields, api, _

class Chat(models.Model):
    _inherit = 'pos.session'

    plays = fields.Boolean(default=False)
    cards = fields.Text(default='')

    @api.model
    def send_field_updates(self, name, message, command, uid):
        channel_name = "pos_chat"
        if command == "Disconnect":
            self.search([("user_id", "=", uid)]).write({
                'plays': False
            })
        data = {'name': name, 'message': message, 'uid': uid, 'command': command}
        self.env['pos.config'].send_to_all_poses(channel_name, data)

    @api.model
    def send_to_user(self, command, message, pos_id):
        data = {'command': command, 'message': message}
        channel = self.env['pos.config']._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
        self.env['bus.bus'].sendmany([[channel, data]])

    @api.model
    def send_all_user_data_to(self, name, true_name, participate, allow, from_uid, command, to_uid):
        data = {'name': name, 'true_name': true_name, 'participate': participate, 'allow': allow,
                'uid': from_uid, 'command': command}
        pos_id = self.search([('state', '=', 'opened'), ('user_id', '=', to_uid)], limit=1).id
        channel = self.env['pos.config']._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
        self.env['bus.bus'].sendmany([[channel, data]])

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

    @api.model
    def distribution(self):
        players = self.search([('plays', '=', True)])
        seq = [*range(0, 51)]
        random.shuffle(seq)
        card_nums = []
        i = 0
        for num in seq:
            card_nums.append(num)
            if len(card_nums) == 7:
                temp_str = ""
                for j in card_nums:
                    temp_str += str(j)
                    temp_str += ' '
                card_nums.clear()
                players[i].write({
                    'cards': temp_str
                })
                self.send_to_user('Cards', temp_str, players[i].id)
                i += 1
            if(i >= len(players)):
                break
        temp_str = ''
        for k in range(len(players)*7 - 1, 51):
            temp_str += str(seq[k]) + ' '
        self.send_field_updates(str(random.randint(0, 3)),
                                temp_str, "Extra", -1)

    @api.model
    def Moved(self, from_uid, card):
        pos = self.search([('user_id', '=', from_uid)])
        pos.write({
            'cards': re.sub(card + " ", "", pos.cards)
        })
        self.send_field_updates('', card + " " + str(from_uid), 'Move', -1)
