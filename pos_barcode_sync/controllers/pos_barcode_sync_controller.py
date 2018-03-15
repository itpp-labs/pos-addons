# -*- coding: utf-8 -*-
import openerp
from odoo.http import request


try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    BusController = object


class Controller(BusController):

    @openerp.http.route('/barcode/update', type="json", auth="public")
    def send_barcode_update(self, message, partner_id):
        channel_name = "pos_barcode_sync"
        pos_configs = request.env["pos.config"].search([('active', '=', True)])
        res = pos_configs._send_to_channel(channel_name, {'message': message, 'partner_id': partner_id})
        return res
