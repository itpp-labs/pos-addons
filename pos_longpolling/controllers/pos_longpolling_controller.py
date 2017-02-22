# -*- coding: utf-8 -*-
import datetime
import logging
import json

import openerp
from openerp.http import request
from openerp.addons.bus.bus import Controller as bus_controller
from openerp.tools.misc import DEFAULT_SERVER_DATETIME_FORMAT

_logger = logging.getLogger(__name__)


class Controller(bus_controller):
    @openerp.http.route('/pos_longpolling/update', type="json", auth="public")
    def update_connection(self, pos_id, message):
        channel_name = "pos.longpolling"
        res = request.env["pos.config"].browse(int(pos_id))._send_to_channel(channel_name, message)
        return res
