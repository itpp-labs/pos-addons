import logging

import odoo
from odoo.http import request

_logger = logging.getLogger(__name__)


try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error("pos_longpolling inconsisten with odoo version")
    BusController = object


class Controller(BusController):
    @odoo.http.route("/pos_longpolling/update", type="json", auth="public")
    def update_connection(self, pos_id, message, db_name):
        channel_name = "pos.longpolling"
        pos_config_model = request.env["pos.config"]
        if (
            request.env["ir.config_parameter"]
            .sudo()
            .get_param("pos_longpolling.allow_public")
        ):
            pos_config_model = pos_config_model.sudo()
        res = pos_config_model.browse(int(pos_id))._send_to_channel_by_id(
            db_name, pos_id, channel_name
        )
        return res
