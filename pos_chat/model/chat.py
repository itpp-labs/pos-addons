from odoo import models, fields, api, _
import wdb

class Chat(models.Model):
    _name = 'pos.chat'

    name = fields.Char(string='Name')
    maxUsers = fields.Integer()
    current_user = fields.Many2one('res.users','Current User', default=lambda self: self.env.user.id)

    @api.model
    def get_user_name(self):
        return self.current_user

    @api.model
    def send_field_updates(self, message, date, name, mode):
        channel_name = "pos_chat_228"
        data = {'message': message, 'date': date, 'name': name, 'mode': mode}
        self.env['pos.config'].send_to_all_poses(channel_name, data)
