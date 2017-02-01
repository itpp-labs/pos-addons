# -*- coding: utf-8 -*-
from odoo import api, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    @api.multi
    def _send_to_channel(self, channel_name, message):
        notifications = []
        for ps in self.env['pos.session'].search([('state', '!=', 'closed'), ('id', 'in', self.ids)]):
            channel = '["%s","%s","%s"]' % (self._cr.dbname, channel_name, ps.config_id.id)
            notifications.append([channel, message])
        self.env['bus.bus'].sendmany(notifications)
        return 1
