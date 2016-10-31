# -*- coding: utf-8 -*-
from openerp import api
from openerp import fields
from openerp import models
import json


class PosConfig(models.Model):
    _inherit = 'pos.config'

    multi_session_id = fields.Many2one('pos.multi_session', 'Multi-session', help='Set the same value for POSes where orders should be synced. Keep empty if this POS should not use syncing')
    multi_session_accept_incoming_orders = fields.Boolean('Accept incoming orders', default=True)
    multi_session_replace_empty_order = fields.Boolean('Replace empty order', default=True, help='Empty order is deleted whenever new order is come from another POS')
    multi_session_deactivate_empty_order = fields.Boolean('Deactivate empty order', default=False, help='POS is switched to new foreign Order, if current order is empty')
    multi_session_message_ID = fields.Integer(default=1, string="Last sent message number")


class PosMultiSession(models.Model):
    _name = 'pos.multi_session'

    name = fields.Char('Name')
    pos_ids = fields.One2many('pos.config', 'multi_session_id', 'POSes')
    order_ID = fields.Integer(string="Order number", default=1, help="Current Order Number shared across all POS in Multi Session")
    order_ids = fields.One2many('pos.multi_session.order', 'multi_session_id')

    @api.multi
    def on_update_message(self, message):
        self.ensure_one()
        if message['action'] == 'update_order':
            res = self.set_order(message)
        elif message['action'] == 'sync_all':
            res = self.get_sync_all(message)
        elif message['action'] == 'remove_order':
            res = self.remove_order(message)
        else:
            res = self.broadcast_message(message)
        return res

    @api.multi
    def set_order(self, message):
        self.ensure_one()
        msg_data = message['data']
        order_uid = msg_data['uid']
        order = self.env['pos.multi_session.order'].search([('order_uid', '=', order_uid)])
        if order:  # order already exists
            order.write({
                'order': json.dumps(message),
            })
        else:
            order.create({
                'order': json.dumps(message),
                'order_uid': order_uid,
                'multi_session_id': self.id,
            })
        self.broadcast_message(message)
        return 1

    @api.multi
    def get_sync_all(self, message):
        self.ensure_one()
        pos_id = message['data']['pos_id']
        pos = self.env['pos.config'].search([('multi_session_id', '=', self.id), ("id", "=", pos_id)])
        message = []
        for order in self.order_ids:
            msg = json.loads(order.order)
            msg['data']['message_ID'] = pos.multi_session_message_ID
            msg['action'] = 'sync_all'
            message.append(msg)
        return message

    @api.multi
    def remove_order(self, message):
        self.ensure_one()
        msg_data = message['data']
        order_uid = msg_data['uid']
        self.order_ids.search([('order_uid', '=', order_uid)]).unlink()
        self.broadcast_message(message)
        return 1

    @api.multi
    def broadcast_message(self, message):
        self.ensure_one()
        pos_id = message['data']['pos_id']
        for r in self.env['pos.config'].search([('id', '!=', pos_id), ('multi_session_id', '=', self.id)]):
            if r.multi_session_message_ID:
                r.write({
                    'multi_session_message_ID': r.multi_session_message_ID + 1
                })
        notifications = []
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.id)]):
            if ps.user_id.id != self.env.user.id:
                message_ID = self.env['pos.config'].search([('id', '=', ps.config_id.id)]).multi_session_message_ID
                message['data']['message_ID'] = message_ID
                notifications.append([(self._cr.dbname, 'pos.multi_session', ps.user_id.id), message])
        self.env['bus.bus'].sendmany(notifications)
        return 1


class PosMultiSessionOrder(models.Model):
    _name = 'pos.multi_session.order'

    order = fields.Text('Order JSON format')
    order_uid = fields.Char()
    multi_session_id = fields.Many2one('pos.multi_session', 'Multi session')


class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.multi
    def wkf_action_closing_control(self):
        self.config_id.write({'multi_session_message_ID': 1})
        res = super(PosSession, self).wkf_action_closing_control()
        active_sessions = self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.config_id.multi_session_id.id)])
        if len(active_sessions) == 0:
            self.config_id.multi_session_id.write({'order_ID': 1})
        return res
