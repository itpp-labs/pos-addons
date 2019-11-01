import json

from odoo import http
from odoo.http import request
from odoo.addons.point_of_sale.controllers.main import PosController


class ControllerPos(PosController):

    @http.route()
    def pos_web(self, debug=False, **k):
        response = super(ControllerPos, self).pos_web(debug, **k)
        pos_sessions = request.env['pos.session'].search([
            ('state', '=', 'opened'),
            ('user_id', '=', request.session.uid),
            ('rescue', '=', False)])
        if pos_sessions and pos_sessions.config_id.auto_mobile:
            session_info = request.env['ir.http'].session_info()
            session_info['auto_mobile'] = True
            response.qcontext.update({
                'session_info': json.dumps(session_info),
            })
        return response
