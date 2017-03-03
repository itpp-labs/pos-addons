# -*- coding: utf-8 -*-
import logging

import openerp
from openerp.http import request

_logger = logging.getLogger(__name__)


try:
    from openerp.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error('pos_longpolling inconsisten with odoo version')
    BusController = object


class Controller(BusController):
    @openerp.http.route('/pos_longpolling/update', type="json", auth="public")
    def update_connection(self, pos_id, message):
        channel_name = "pos.longpolling"
        res = request.env["pos.config"].browse(int(pos_id))._send_to_channel(channel_name, message)
        return res
