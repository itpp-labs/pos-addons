# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import base64
from odoo.exceptions import UserError

from odoo import http, _
from odoo.http import request
import requests

_logger = logging.getLogger(__name__)


class WechatMiniProgramController(http.Controller):

    @http.route('/wechat/miniprogram/authenticate', type='json', auth='public', csrf=False)
    def authenticate(self, code, user_info, test_cr=False):
        """
        :param code: After the user is permitted to log in on the WeChat mini-program, the callback content will
        bring the code (five-minute validity period). The developer needs to send the code to the backend
        of their server and use code in exchange for the session_key api.
        The code is exchanged for the openid and session_key.
        :param user_info: User information object, does not contain sensitive information such as openid
        :return session_info: All information about session such as session_id, uid, etc.
        """
        _logger.debug('/wechat/miniprogram/authenticate request: code - %s, user_info - %s', code, user_info)
        openid, session_key = self.get_openid(code)
        _logger.debug('Authenticate on WeChat server: openid - %s, session_key - %s', openid, session_key)

        if not openid or not session_key:
            raise UserError(_('Unable to get data from WeChat server : openid - %s, session_key - %s') % (openid, session_key))

        User = request.env['res.users'].sudo()
        user = User.search([('openid', '=', openid)])
        if user:
            user.write({
                'wechat_session_key': session_key,
            })
        else:
            country = request.env['res.country'].search([('name', 'like', '%'+user_info.get('country')+'%')], limit=1)
            name = user_info.get('nickName')
            login = "wechat_%s" % openid
            city = user_info.get('city')

            user = User.create({
                'company_id': request.env.ref("base.main_company").id,
                'name': name,
                'image': base64.b64encode(requests.get(user_info.get('avatarUrl')).content) if user_info.get('avatarUrl') else None,
                'openid': openid,
                'wechat_session_key': session_key,
                'login': login,
                'country_id': country.id if country else None,
                'city': city,
                'groups_id': [(4, request.env.ref('wechat_miniprogram.group_miniprogram_user').id)]
            })

        if test_cr is False:
            # A new cursor is used to authenticate the user and it cannot see the
            # latest changes of current transaction.
            # Therefore we need to make the commit.

            # In test mode, one special cursor is used for all transactions.
            # So we don't need to make the commit. More over commit() shall not be used,
            # because otherwise test changes are not rollbacked at the end of test
            request.env.cr.commit()

        request.session.authenticate(request.db, user.login, user.wechat_session_key)
        _logger.debug('Current user login: %s, id: %s', request.env.user.login, request.env.user.id)
        session_info = request.env['ir.http'].session_info()
        return session_info

    def get_openid(self, code):
        """Get openid

        :param code: After the user is permitted to log in on the WeChat mini-program, the callback content will
        bring the code (five-minute validity period). The developer needs to send the code to the backend
        of their server and use code in exchange for the session_key api.
        The code is exchanged for the openid and session_key.
        :return openid: The WeChat user's unique ID
        """
        url = request.env['ir.config_parameter'].sudo().get_openid_url(code)
        response = requests.get(url)
        response.raise_for_status()
        value = response.json()
        _logger.debug('get_openid function return parameters: %s', value)
        openid = value.get('openid')
        session_key = value.get('session_key')
        return openid, session_key
