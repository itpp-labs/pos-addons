# -*- coding: utf-8 -*-
import logging
from openerp import api, models

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    @api.multi
    def _send_to_channel(self, channel_name, message):
        notifications = []
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id', 'in', self.ids)]):
            channel = ps.config_id._get_full_channel_name(channel_name)
            notifications.append([channel, message])
        if notifications:
            self.env['bus.bus'].sendmany(notifications)
        _logger.debug('POS notifications for %s: %s', self.ids, notifications)
        return 1

    @api.multi
    def _get_full_channel_name(self, channel_name):
        self.ensure_one()
        return '["%s","%s","%s"]' % (self._cr.dbname, channel_name, self.id)
