# -*- coding: utf-8 -*- 
from openerp import api, models, fields, SUPERUSER_ID


class pos_config(models.Model):
    _inherit = 'pos.config'

    multi_session_id = fields.Many2one('pos.multi_session', 'Multi-session', help='Set the same value for POSes where orders should be synced. Keep empty if this POS should not use syncing')
    multi_session_accept_incoming_orders = fields.Boolean('Accept incoming orders', default=True)

    def _check_same_floors(self, cr, uid, ids, context=None):
        for rec in self.browse(cr, uid, ids, context=context):
            pos_config_ids = self.pool['pos.config'].search(cr, uid, [
                ('multi_session_id', '=', rec.multi_session_id.id),
                ('id', '!=', rec.id)
            ])
            for pos_config_obj in [r for r in self.browse(cr, uid, pos_config_ids, context=context)]:
                a = set(pos_config_obj.floor_ids.ids)
                b = set(rec.floor_ids.ids)
                diff = a.difference(b)
                if diff:
                    return False
        return True

    _constraints = [
        (_check_same_floors, "Points of sale with same multi session must have same floors", ['multi_session_id', 'floor_ids']),
    ]


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
