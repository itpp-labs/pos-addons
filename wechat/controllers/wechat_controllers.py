# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class WechatController(http.Controller):

    @http.route('/wechat/callback', methods=['POST'], auth='user', type='json')
    def micropay(self, **kwargs):
        _logger.debug('/wechat/callback request data: %s', kwargs)
        request.env['wechat.order'].on_notification(kwargs)
