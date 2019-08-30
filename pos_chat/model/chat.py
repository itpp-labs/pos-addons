import logging
from odoo import models, fields, api, _

_logger = logging.getLogger(__name__)

class Chat(models.Model):
    _name = 'pos.chat'
    _inherit = 'pos.config'

    name = fields.Char(string='Name')
    maxUsers = fields.Integer()
    current_user = fields.Many2one('res.users','Current User', default=lambda self: self.env.user.id)
    dbname = fields.Char(index=True)

    @api.model
    def get_dbname(self, uid):
        return self.env.cr.dbname;

    @api.model
    def send_field_updates(self, name, message, command, uid):
        channel_name = "pos_chat"
        data = {'name': name, 'message': message, 'uid': uid, 'command': command}
        self.env['pos.config'].send_to_all_poses(channel_name, data)

    @api.model
    def send_to_channel_all_but_id(self, new_name, but_uid):
        pos_id = 0
        poses_ids = self.env['pos.session'].search([('state', '=', 'opened')])
        id = self.env['pos.session'].search([('state', '=', 'opened'), ('user_id', '=', but_uid)], limit=1).id
        data = {'uid': but_uid, 'message': new_name}
        while pos_id <= len(poses_ids):
            pos_id = pos_id + 1
            if(pos_id == id or pos_id > len(poses_ids)):
                continue
            channel = self._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
            self.env['bus.bus'].sendmany([[channel, data]])
            _logger.debug('POS notifications for %s: %s', pos_id, [[channel, data]])
        return 1

    @api.model
    def send_to_channel_by_id(self, to_uid, from_uid, command):
        data = {'uid': from_uid, 'command': command}
        pos_id = self.env['pos.session'].search([('state', '=', 'opened'), ('user_id', '=', to_uid)], limit=1).id
        channel = self._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
        self.env['bus.bus'].sendmany([[channel, data]])
        _logger.debug('POS notifications for %s: %s', pos_id, [[channel, data]])
        return 1
