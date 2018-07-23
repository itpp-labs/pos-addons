# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
try:
    from unittest.mock import patch
except ImportError:
    from mock import patch

from odoo.tests.common import HttpCase, HOST, PORT, get_db_name
from odoo import api, SUPERUSER_ID
from odoo.addons.bus.models.bus import dispatch


_logger = logging.getLogger(__name__)
DUMMY_AUTH_CODE = '134579302432164181'
DUMMY_POS_ID = 1


# TODO clean this up: no need to use HttpCase. Also some helpers are not used.
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

    def url_open_json(self, url, data=None, timeout=10):
        headers = {
            'Content-Type': 'application/json'
        }
        res = self.url_open_extra(url, data=data, timeout=timeout, headers=headers)
        return res.json()

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
            'openid': '123',
            'total_fee': 123,
        }
        return result

    def test_micropay_backend(self):
        """Test payment workflow from server side.

        * Cashier scanned buyer's QR and upload it to odoo server,
        odoo server sends information to wechat servers and wait for response with result.

        * Once user authorize the payment, odoo receives result syncroniosly from
        previously sent request.

        * Odoo sends result to POS via longpolling.

        Due to limititation of testing framework, we use syncronios call for testing

        """

        # make request with scanned qr code (auth_code)
        msg = self.env['wechat.micropay'].pos_create_from_qr_sync(**{
            'auth_code': DUMMY_AUTH_CODE,
            'terminal_ref': 'POS/%s' % DUMMY_POS_ID,
            'pos_id': DUMMY_POS_ID,
            'journal_id': self.env.ref('pos_wechat.wechat_micropay_journal').id,
            'pay_amount': 1,
        })
        self.assertEqual(msg.get('result_code'), 'SUCCESS', "Wrong result_code. The patch doesn't work?")
