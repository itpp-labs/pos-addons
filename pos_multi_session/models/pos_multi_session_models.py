# -*- coding: utf-8 -*-
import logging
import json
import time

from openerp import api
from openerp import fields
from openerp import models

_logger = logging.getLogger(__name__)


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
    order_ids = fields.One2many('pos.multi_session.order', 'multi_session_id', 'Orders')
    order_ID = fields.Integer(string="Order number", default=0, help="Current Order Number shared across all POS in Multi Session")

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
        order = self.env['pos.multi_session.order'].search([('order_uid', '=', order_uid)])
        revision = self.check_order_revision(message, order)
        if not revision or (order and order.state == 'deleted'):
            return {'action': 'revision_error'}
        if order:  # order already exists
            order.write({
                'order': json.dumps(message),
                'revision_ID': order.revision_ID + 1,
            })
        else:
            if self.order_ID + 1 != sequence_number:
                sequence_number = self.order_ID + 1
                message['data']['sequence_number'] = sequence_number
            order = order.create({
                'order': json.dumps(message),
                'order_uid': order_uid,
                'multi_session_id': self.id,
            })
            self.write({'order_ID': sequence_number})
        revision_ID = order.revision_ID
        message['data']['revision_ID'] = revision_ID
        self.broadcast_message(message)
        return {'action': 'update_revision_ID', 'revision_ID': revision_ID, 'order_ID': sequence_number}

    @api.multi
    def get_sync_all(self, message):
        self.ensure_one()
        pos_id = message['data']['pos_id']
        pos = self.env['pos.config'].search([('multi_session_id', '=', self.id), ("id", "=", pos_id)])
        data = []
        for order in self.env['pos.multi_session.order'].search([('multi_session_id', '=', self.id), ('state', '=', 'draft')]):
            msg = json.loads(order.order)
            msg['data']['message_ID'] = pos.multi_session_message_ID
            msg['data']['revision_ID'] = order.revision_ID
            data.append(msg)
        message = {'action': 'sync_all', 'orders': data, 'order_ID': self.order_ID}
        return message

    @api.multi
    def remove_order(self, message):
        self.ensure_one()
        order_uid = message['data']['uid']

        order = self.env['pos.multi_session.order'].search([('order_uid', '=', order_uid)])
        if order.state is not 'deleted':
            revision = self.check_order_revision(message, order)
            if not revision:
                return {'action': 'revision_error'}
        if order:
            order.state = 'deleted'
        self.broadcast_message(message)
        return 1

    @api.multi
    def broadcast_message(self, message):
        self.ensure_one()
        notifications = []
        channel_name = "pos.multi_session"
        for ps in self.env['pos.session'].search([('user_id', '!=', self.env.user.id), ('state', '!=', 'closed'),
                                                  ('config_id.multi_session_id', '=', self.id)]):
            message_ID = ps.config_id.multi_session_message_ID
            message_ID += 1
            ps.config_id.multi_session_message_ID = message_ID
            message['data']['message_ID'] = message_ID
            ps.config_id._send_to_channel(channel_name, message)

        if self.env.context.get('phantomtest') == 'slowConnection':
            _logger.info('Delayed notifications from %s: %s', self.env.user.id, notifications)
            # commit to update values on DB
            self.env.cr.commit()
            time.sleep(3)
        return 1


class PosMultiSessionOrder(models.Model):
    _name = 'pos.multi_session.order'

    order = fields.Text('Order JSON format')
    order_uid = fields.Char(index=True)
    state = fields.Selection([('draft', 'Draft'), ('deleted', 'Deleted'), ('unpaid', 'Unpaid and removed')], default='draft', index=True)
    revision_ID = fields.Integer(default=1, string="Revision", help="Number of updates received from clients")
    multi_session_id = fields.Many2one('pos.multi_session', 'Multi session', index=True)


class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.multi
    def action_pos_session_close(self):
        res = super(PosSession, self).action_pos_session_close()
        self.config_id.write({'multi_session_message_ID': 1})
        active_sessions = self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.config_id.multi_session_id.id)])
        if len(active_sessions) == 0:
            self.config_id.multi_session_id.sudo().write({'order_ID': 0})
            orders = self.config_id.multi_session_id.order_ids.filtered(lambda x: x.state == "draft")
            orders.write({'state': 'unpaid'})
        return res
