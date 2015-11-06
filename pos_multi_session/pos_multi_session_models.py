# -*- coding: utf-8 -*- 
from openerp import api, models, fields, SUPERUSER_ID


class pos_config(models.Model):
    _inherit = 'pos.config'

    multi_session_id = fields.Many2one('pos.multi_session', 'Multi-session', help='Set the same value for POSes where orders should be synced. Keep empty if this POS should not use syncing')
    multi_session_accept_incoming_orders = fields.Boolean('Accept incoming orders', default=True)


class pos_multi_session(models.Model):
    _name = 'pos.multi_session'

    name = fields.Char('Name')
    pos_ids = fields.One2many('pos.config', 'multi_session_id', 'POSes')

    @api.one
    def broadcast(self, message):
        notifications = []
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'),('config_id.multi_session_id', '=', self.id)]):
            if ps.user_id.id != self.env.user.id:
                notifications.append([(self._cr.dbname, 'pos.multi_session', ps.user_id.id), message])
        self.env['bus.bus'].sendmany(notifications)
        return 1
