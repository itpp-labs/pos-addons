# -*- coding: utf-8 -*-
import logging

import odoo
from odoo.http import request

_logger = logging.getLogger(__name__)


try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error('pos_multi_session inconsisten with odoo version')
    BusController = object


class Controller(BusController):
    @odoo.http.route('/pos_longpolling/update', type="json", auth="public")
    def update_connection(self, pos_id, message):
        channel_name = "pos.longpolling"
        res = request.env["pos.config"].browse(int(pos_id))._send_to_channel(channel_name, message)
        return res
