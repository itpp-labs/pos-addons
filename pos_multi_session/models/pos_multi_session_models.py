# -*- coding: utf-8 -*-
import logging
import json
import time

from odoo import api
from odoo import fields
from odoo import models

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    multi_session_id = fields.Many2one('pos.multi_session', 'Multi-session', help='Set the same value for POSes where orders should be synced. Keep empty if this POS should not use syncing. Before updating it you need to close active session')
    multi_session_accept_incoming_orders = fields.Boolean('Accept incoming orders', default=True)
    multi_session_replace_empty_order = fields.Boolean('Replace empty order', default=True, help='Empty order is deleted whenever new order is come from another POS')
    multi_session_deactivate_empty_order = fields.Boolean('Deactivate empty order', default=False, help='POS is switched to new foreign Order, if current order is empty')
    multi_session_message_ID = fields.Integer(default=1, string="Last sent message number")
    current_session_state = fields.Char(search='_search_current_session_state')
    sync_server = fields.Char(related='multi_session_id.sync_server')
    autostart_longpolling = fields.Boolean(default=False)

    def _search_current_session_state(self, operator, value):
        ids = map(lambda x: x.id, self.env["pos.config"].search([]))
        value_ids = map(lambda x: x.config_id.id, self.env["pos.session"].search([('state', '=', value)]))
        value_ids = list(set(value_ids))
        if operator == '=':
            return [('id', 'in', value_ids)]
        elif operator == '!=':
            ids = [item for item in ids if item not in value_ids]
            return [('id', 'in', ids)]
        else:
            return [('id', 'in', [])]


class PosMultiSession(models.Model):
    _name = 'pos.multi_session'

    name = fields.Char('Name')
    pos_ids = fields.One2many('pos.config', 'multi_session_id', string='POSes in Multi-session')
    order_ids = fields.One2many('pos_multi_session_sync.order', 'multi_session_ID', 'Orders')
    order_ID = fields.Integer(string="Order number", default=0, help="Current Order Number shared across all POS in Multi Session")
    sync_server = fields.Char('Sync Server', default='')
