from odoo import http
from odoo.http import request

from odoo.addons.point_of_sale.controllers.main import PosController


class ControllerPos(PosController):
    @http.route()
    def pos_web(self, config_id=False, **k):
        response = super(ControllerPos, self).pos_web(config_id, **k)
        pos_sessions = request.env["pos.session"].search(
            [
                ("state", "=", "opened"),
                ("user_id", "=", request.session.uid),
                ("rescue", "=", False),
            ]
        )
        if pos_sessions and pos_sessions.config_id.auto_mobile:
            response.qcontext["session_info"]["auto_mobile"] = True
        return response
