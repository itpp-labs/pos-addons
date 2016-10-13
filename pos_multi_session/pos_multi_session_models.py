# -*- coding: utf-8 -*-
from openerp import api
from openerp import fields
from openerp import models
import json


class pos_config(models.Model):
    _inherit = 'pos.config'

    multi_session_id = fields.Many2one('pos.multi_session', 'Multi-session', help='Set the same value for POSes where orders should be synced. Keep empty if this POS should not use syncing')
    multi_session_accept_incoming_orders = fields.Boolean('Accept incoming orders', default=True)
    multi_session_replace_empty_order = fields.Boolean('Replace empty order', default=True, help='Empty order is deleted whenever new order is come from another POS')
    multi_session_deactivate_empty_order = fields.Boolean('Deactivate empty order', default=False, help='POS is switched to new foreign Order, if current order is empty')


class pos_multi_session(models.Model):
    _name = 'pos.multi_session'

    name = fields.Char('Name')
    pos_ids = fields.One2many('pos.config', 'multi_session_id', 'POSes')
    order_ids = fields.One2many('pos.multi_session.order', 'multi_session_id')
    order_number_ids = fields.One2many('pos.multi_session.order_number', 'multi_session_id', string="Last number is order")

    @api.one
    def on_update_message(self, message):
        if message['action'] == 'update':
            res = self.set_order(message)
        elif message['action'] == 'request_sync_all':
            res = self.get_orders(message)
        elif message['action'] == 'remove_order':
            res = self.remove_order(message)
        else:
            res = self.broadcast(message)
        return res

    @api.one #
    def get_order_number(self, message):
        pos_id = message['data']['pos_id']
        for ps in self.env['pos.config'].search([('id', '!=', pos_id),('multi_session_id', '=', self.id)]):
            number = self.env['pos.multi_session.order_number'].search([('pos_config_id', '=', ps.id),('multi_session_id', '=', self.id)])
            if number:
                number.write({
                    'order_number': number.order_number + 1
                })
            else:
                number.create({
                    'pos_config_id': ps.id,
                    'multi_session_id': self.id,
                    'order_number': 1
                })
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.id)]):
            notifications = []
            number = self.env['pos.multi_session.order_number'].search([('pos_config_id', '=', ps.config_id.id),('multi_session_id', '=', self.id)]).order_number
            message['data']['order_number'] = number
            if ps.user_id.id != self.env.user.id:
                notifications.append([(self._cr.dbname, 'pos.multi_session', ps.user_id.id), message])
            self.env['bus.bus'].sendmany(notifications)

    @api.one
    def set_order(self, message):
        msg_data = message['data']
        order_uid = msg_data['uid']
        order = self.env['pos.multi_session.order'].search([('order_uid', '=', order_uid)])
        if order:  # only one object with current order_uid
            order.write({
                'order': json.dumps(message),
            })
        else:
            order.create({
                'order': json.dumps(message),
                'order_uid': order_uid,
                'multi_session_id': self.id,
            })
        self.get_order_number(message)
        return 1

    @api.one
    def get_orders(self, message):
        pos_id = message['data']['pos_id']
        number = self.env['pos.multi_session.order_number'].search([('multi_session_id', '=', self.id),
                                                                    ("pos_config_id", "=", pos_id)])
        order_obj = self.order_ids.search([("multi_session_id", "=", self.id)])
        notifications = []
        for e in order_obj:
            message = json.loads(e.order)
            message['data']['order_number'] = number.order_number
            message['action'] = 'request_sync_all'
            notifications.append([(self._cr.dbname, 'pos.multi_session', self.env.user.id), message])
        self.env['bus.bus'].sendmany(notifications)
        return 1

    @api.one
    def remove_order(self, message):
        msg_data = message['data']
        order_uid = msg_data['uid']
        self.order_ids.search([('order_uid', '=', order_uid)]).unlink()
        self.broadcast(message)
        return 1

    @api.one
    def broadcast(self, message):
        notifications = []
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.id)]):
            if ps.user_id.id != self.env.user.id:
                notifications.append([(self._cr.dbname, 'pos.multi_session', ps.user_id.id), message])
        self.env['bus.bus'].sendmany(notifications)
        return 1


class pos_multi_session_order(models.Model):
    _name = 'pos.multi_session.order'

    order = fields.Text('Order JSON format')
    order_uid = fields.Char()
    multi_session_id = fields.Many2one('pos.multi_session', 'Multi session')

class pos_multi_session_order_number(models.Model):
    _name = 'pos.multi_session.order_number'

    order_number = fields.Integer(string="Order number", default=0)
    pos_config_id = fields.Many2one('pos.config', 'POS')
    multi_session_id = fields.Many2one('pos.multi_session', 'Multi session')