
import logging
from odoo import api, models, fields

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    # 5/60 = 0.0833 = 5 min - default value
    query_timeout = fields.Float(string='Query timeout', default=0.0833,
                                 help="Waiting period for any message from poll "
                                      "(if we have not received a message at this period, "
                                      "poll will send message ('PING') to check the connection)")

    # 1/60 = 0.01666 = 1 min - default value
    response_timeout = fields.Float(string='Response timeout', default=0.01666,
                                    help="Waiting period for response message (i.e. once message from "
                                         "poll has been sent, it will be waiting for response message ('PONG') "
                                         "at this period and if the message has not been received, the icon turns "
                                         "color to red. Once the connection is restored, the icon changes its color "
                                         "back to green)")
    autostart_longpolling = fields.Boolean('Autostart longpolling', default=True,
                                           help='When switched off longpoling will start only when other module start it')

    @api.multi
    def _send_to_channel(self, channel_name, message='PONG'):
        notifications = []
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id', 'in', self.ids)]):
            channel = ps.config_id._get_full_channel_name(channel_name)
            notifications.append([channel, message])
        if notifications:
            self.env['bus.bus'].sendmany(notifications)
        _logger.debug('POS notifications for %s: %s', self.ids, notifications)
        return 1

    @api.model
    def _send_to_channel_by_id(self, dbname, pos_id, channel_name, message='PONG'):
        channel = self._get_full_channel_name_by_id(dbname, pos_id, channel_name)
        self.env['bus.bus'].sendmany([[channel, message]])
        _logger.debug('POS notifications for %s: %s', pos_id, [[channel, message]])
        return 1

    @api.multi
    def _get_full_channel_name(self, channel_name):
        self.ensure_one()
        return self._get_full_channel_name_by_id(self._cr.dbname, self.id, channel_name)

    @api.model
    def _get_full_channel_name_by_id(self, dbname, pos_id, channel_name):
        return '["%s","%s","%s"]' % (dbname, channel_name, pos_id)
