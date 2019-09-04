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
    def send_field_updates(self, name, message, command, uid):
        channel_name = "pos_chat"
        data = {'name': name, 'message': message, 'uid': uid, 'command': command}
        self.env['pos.config'].send_to_all_poses(channel_name, data)

    @api.model
    def send_to_channel_all_but_id(self, new_name, but_uid):
        # pos_id = 0
        poses_ids = self.env['pos.session'].search([('state', '=', 'opened')])
        but_pos_session_id = poses_ids.filtered(lambda ps: ps.user_id == but_uid)

        data = {'uid': but_uid, 'message': new_name}

        for pos_id in (poses_ids - but_pos_session_id).ids:
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

    @api.model
    def send_to_user(self, name, true_name, participate, allow, from_uid, command, to_uid):
        data = {'name': name, 'true_name': true_name, 'participate': participate, 'allow': allow,
                'uid': from_uid, 'command': command}
        pos_id = self.env['pos.session'].search([('state', '=', 'opened'), ('user_id', '=', to_uid)], limit=1).id
        channel = self._get_full_channel_name_by_id(self.env.cr.dbname, pos_id, "pos_chat")
        self.env['bus.bus'].sendmany([[channel, data]])
        _logger.debug('POS notifications for %s: %s', pos_id, [[channel, data]])
        return 1
