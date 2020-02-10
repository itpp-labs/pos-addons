# -*- coding: utf-8 -*-
import openerp

from odoo.http import request

try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    BusController = object


class Controller(BusController):
    @openerp.http.route("/pos_order_test/update", type="json", auth="public")
    def order_test_update(self, message):
        channel_name = "pos.order_test"
        res = request.env["pos.config"]._send_to_channel(channel_name, message)
        return res
