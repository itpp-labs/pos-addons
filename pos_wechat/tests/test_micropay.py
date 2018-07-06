# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
try:
    from unittest.mock import patch
except ImportError:
    from mock import patch

from odoo.tests.common import HttpCase, HOST, PORT, get_db_name
from odoo import api, SUPERUSER_ID

from ..models.wechat_micropay import CHANNEL_MICROPAY


_logger = logging.getLogger(__name__)
DUMMY_AUTH_CODE = '134579302432164181'
DUMMY_POS_ID = 1


class TestMicropay(HttpCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestMicropay, self).setUp()
        self.phantom_env = api.Environment(self.registry.test_cr, self.uid, {})

        # patch wechat
        patcher = patch('wechatpy.pay.base.BaseWeChatPayAPI._post', wraps=self._post)
        patcher.start()
        self.addCleanup(patcher.stop)

    def xmlrpc(self, model, method, args, kwargs=None, login=SUPERUSER_ID, password='admin'):
        db_name = get_db_name()
        return self.xmlrpc_object.execute_kw(db_name, login, password, model, method, args, kwargs)

    def _get_pos_longpolling_messages(self, channel, pos_id, db_name=None):
        db_name = db_name or self.phantom_env.cr.dbname

        res = self.url_open_json('/longpolling/poll', )
        return res.json()['result']

    def url_open_json(self, url, data=None, timeout=10):
        headers = {
            'Content-Type': 'application/json'
        }
        return self.url_open_extra(url, data=data, timeout=timeout, headers=headers)

    def url_open_extra(self, url, data=None, timeout=10, headers=None):
        if url.startswith('/'):
            url = "http://%s:%s%s" % (HOST, PORT, url)
        if data:
            return self.opener.post(url, data=data, timeout=timeout, headers=headers)
        return self.opener.get(url, timeout=timeout, headers=headers)

    def _post(self, url, data):
        MICROPAY_URL = 'pay/micropay'
        self.assertEqual(url, MICROPAY_URL)
        _logger.debug("Request data for %s: %s", MICROPAY_URL, data)

        # see wechatpy/client/base.py::_handle_result for expected result
        # format and tricks that are applied on original _post method
        result = {
            'return_code': 'SUCCESS',
            'result_code': 'SUCCESS',
            'openid': '123'
        }
        return result

    def test_micropay_backend(self):
        """Test payment workflow from server side.

        Cashier scanned buyer's QR and upload it to odoo server,
        odoo server sends information to wechat servers and wait for response with result.

        Once user authorize the payment, odoo receives result syncroniosly from
        previously sent request.

        Odoo sends result to POS via longpolling

        """

        # make request with scanned qr code (auth_code)
        response = self.xmlrpc('wechat.micropay', 'pos_create_from_qr', [], {
            'auth_code': DUMMY_AUTH_CODE,
            'terminal_ref': 'POS/%s' % DUMMY_POS_ID,
            'pos_id': DUMMY_POS_ID,
            'total_fee': 100,
        })

        # check for error on request
        self.assertEqual(response, 'ok', "Error on request")

        # check that payment confirmation is sent via longpolling
        messages = self._get_pos_longpolling_messages(CHANNEL_MICROPAY, DUMMY_POS_ID)
        for msg in messages:
            if msg.get('event') != 'payment_result':
                continue
            self.assertEqual(msg['data'].get('result_code'), 'SUCCESS', "Wrong result_code. The patch doesn't work?")
            break
        else:
            raise Exception("event 'payment_result' is not found")

    def _test_micropay_ui(self):
        """POS saves order and payment information to local cache
        and then tries upload it to odoo server via create_from_ui method"""
        main_pos_config = self.phantom_env.ref('point_of_sale.pos_config_main')
        # create new session and open it
        main_pos_config.open_session_cb()

        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        self.phantom_env['ir.module.module'].search([('name', '=', 'pos_wechat')], limit=1).state = 'installed'

        tour = 'pos_wechat.micropay'
        self.phantom_js(
            '/pos/web',

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".run('%s')" % tour,

            "odoo.__DEBUG__.services['web_tour.tour']"
            ".tours['%s'].ready" % tour,

            login='admin',
        )
