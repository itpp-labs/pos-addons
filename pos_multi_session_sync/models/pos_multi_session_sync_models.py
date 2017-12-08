# -*- coding: utf-8 -*-
import logging
import json
import time

from odoo import api
from odoo import fields
from odoo import models

_logger = logging.getLogger(__name__)


class PosConfigSync(models.Model):
    _name = 'pos_multi_session_sync.pos'

    multi_session_ID = fields.Integer('Multi-session', index=True,
                                      help='Set the same value for POSes where orders should be synced. '
                                           'Keep empty if this POS should not use syncing. '
                                           'Before updating it you need to close active session')
    multi_session_message_ID = fields.Integer(index=True, default=1, string="Last sent Multi-session message number")
    pos_ID = fields.Integer(index=True, string='POS')
    user_ID = fields.Integer(index=True)


class PosMultiSessionSync(models.Model):
    _name = 'pos_multi_session_sync.multi_session'

    multi_session_ID = fields.Integer('Multi-session', index=True,
                                      help='Set the same value for POSes where orders should be synced. '
                                           'Keep empty if this POS should not use syncing. '
                                           'Before updating it you need to close active session')
    order_ID = fields.Integer(index=True, string='Order')
    dbname = fields.Char(index=True)
    order_ids = fields.One2many('pos_multi_session_sync.order', 'multi_session_ID', 'Orders')

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
    def check_order_revision(self, message, order):
        self.ensure_one()
        client_revision_ID = message['data']['revision_ID']
        server_revision_ID = order.revision_ID
        if not server_revision_ID:
            server_revision_ID = 1
        if client_revision_ID is not server_revision_ID:
            return False
        else:
            return True

    @api.multi
    def set_order(self, message):
        self.ensure_one()
        order_uid = message['data']['uid']
        sequence_number = message['data']['sequence_number']
        order = self.env['pos_multi_session_sync.order'].search([('order_uid', '=', order_uid)])
        revision = self.check_order_revision(message, order)
        run_ID = self.env['pos_multi_session_sync.order'].search([('order_uid', '=', order_uid)])\
                     .run_ID or message['data']['run_ID'] or False
        if not revision or (order and order.state == 'deleted'):
            return {'action': 'revision_error'}
        if order:  # order already exists
            order.write({
                'order': json.dumps(message),
                'revision_ID': order.revision_ID + 1,
                'run_ID': message['data']['run_ID']
            })
        else:
            if self.order_ID + 1 != sequence_number:
                sequence_number = self.order_ID + 1
                message['data']['sequence_number'] = sequence_number
            order = order.create({
                'order': json.dumps(message),
                'order_uid': order_uid,
                'multi_session_ID': self.id,
                'run_ID': run_ID,
            })
            self.write({'order_ID': sequence_number})

        revision_ID = order.revision_ID

        message['data']['revision_ID'] = revision_ID
        self.broadcast_message(message)
        return {'action': 'update_revision_ID', 'revision_ID': revision_ID,
                'order_ID': sequence_number, 'run_ID': run_ID}

    @api.multi
    def get_sync_all(self, message):
        self.ensure_one()
        pos_ID = message['data']['pos_id']
        user_ID = self.env.context.get("user_ID")
        pos = self.env['pos_multi_session_sync.pos'] \
                  .search([('multi_session_ID', '=', self.multi_session_ID), ("pos_ID", "=", pos_ID)])
        run_ID = message['data']['run_ID']
        old_orders = self.order_ids.filtered(lambda x: x.state == "draft" and x.run_ID < run_ID)
        if old_orders:
            old_orders.write({'state': 'unpaid'})
            self.write({'order_ID': 0})
        if not pos:
            pos = self.env['pos_multi_session_sync.pos'] \
                .create({'multi_session_ID': self.multi_session_ID, 'pos_ID': pos_ID, 'user_ID': user_ID})
        if pos.user_ID != user_ID:
            pos.user_ID = user_ID
        pos.multi_session_message_ID = 0
        data = []
        for order in self.env['pos_multi_session_sync.order'] \
                         .search([('multi_session_ID', '=', self.id), ('state', '=', 'draft'),
                                  ('run_ID', '=', run_ID)]):
            msg = json.loads(order.order)
            msg['data']['message_ID'] = 0
            msg['data']['revision_ID'] = order.revision_ID
            msg['data']['run_ID'] = run_ID
            data.append(msg)
        message = {'action': 'sync_all', 'orders': data, 'order_ID': self.order_ID}
        return message

    @api.multi
    def remove_order(self, message):
        self.ensure_one()
        order_uid = message['data']['uid']

        order = self.env['pos_multi_session_sync.order'].search([('order_uid', '=', order_uid)])
        if order.state is not 'deleted':
            revision = self.check_order_revision(message, order)
            if not revision:
                return {'action': 'revision_error'}
        if order:
            order.state = 'deleted'
        self.broadcast_message(message)
        return {'order_ID': self.order_ID}

    @api.multi
    def broadcast_message(self, message):
        self.ensure_one()
        notifications = []
        channel_name = "pos.multi_session"
        for pos in self.env['pos_multi_session_sync.pos'].search([('user_ID', '!=', self.env.context.get('user_ID')),
                                                                  ('multi_session_ID', '=', self.multi_session_ID)]):
            message_ID = pos.multi_session_message_ID
            message_ID += 1
            pos.multi_session_message_ID = message_ID
            message['data']['message_ID'] = message_ID
            self.env['pos.config']._send_to_channel_by_id(self.dbname, pos.pos_ID, channel_name, message)

        if self.env.context.get('phantomtest') == 'slowConnection':
            _logger.info('Delayed notifications from %s: %s', self.env.user.id, notifications)
            # commit to update values on DB
            self.env.cr.commit()
            time.sleep(3)

        return 1


class PosMultiSessionSyncOrder(models.Model):
    _name = 'pos_multi_session_sync.order'

    order = fields.Text('Order JSON format')
    order_uid = fields.Char(index=True)
    state = fields.Selection([('draft', 'Draft'), ('deleted', 'Deleted'), ('unpaid', 'Unpaid and removed')], default='draft', index=True)
    revision_ID = fields.Integer(default=1, string="Revision", help="Number of updates received from clients")
    multi_session_ID = fields.Integer(default=0, string='Multi session')
    pos_session_ID = fields.Integer(index=True, default=0, string='POS session')
    run_ID = fields.Integer(index=True, string="Running count", default=1,
                            help="Number of Multi-session starts. "
                                 "It's incremented each time the last session in Multi-session is closed. "
                                 "It's used to prevent synchronization of old orders")
