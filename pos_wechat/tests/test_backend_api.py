# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
try:
    from unittest.mock import patch
except ImportError:
    from mock import patch

from odoo.tests.common import HttpCase, HOST, PORT
from odoo import api

from ...models.pos_order import CHANNEL_MICROPAY


DUMMY_AUTH_CODE = '134579302432164181'
DUMMY_POS_ID = 1


class TestBackendAPI(HttpCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestBackendAPI, self).setUp()
        self.phantom_env = api.Environment(self.registry.test_cr, self.uid, {})

        patcher = patch('TODO', wraps=self._TODO)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _get_pos_longpolling_messages(self, channel, pos_id, db_name=None):
        db_name = db_name or self.env.db_name

        res = self.url_open_json('/longpolling/poll', )
        return res.json()['result']

    def url_open_json(self, url, data=None, timeout=10):
        headers = [
            ('Content-Type', 'application/json'),
        ]
        return self.url_open_extra(url, data=data, timeout=timeout, headers=headers)

    def url_open_extra(self, url, data=None, timeout=10, headers=None):
        if url.startswith('/'):
            url = "http://%s:%s%s" % (HOST, PORT, url)
        if data:
            return self.opener.post(url, data=data, timeout=timeout, headers=headers)
        return self.opener.get(url, timeout=timeout, headers=headers)

    def test_micropay(self):
        """Cashier scanned buyer's QR and upload it to odoo server,
        odoo server passes information to wechat servers.

        Once user authorize the payment, odoo will get it and passes to POS via
        longpolling

        """
        # patch wechat
        TODO

        # make request with scanned qr code (auth_code)
        res = self.url_open('/wechat/miscropay', data={
            'auth_code': DUMMY_AUTH_CODE,
            'pos_id': DUMMY_POS_ID,
        })
        res = res.json()

        # just check that patch works
        self.assertEqual(res['api_response']['return_code'], 'SUCCESS',
                         "It seems that Mock patch doesn't work")

        # trigger payment event
        TODO

        # check that payment confirmation is sent via longpolling
        messages = self._get_pos_longpolling_messages(CHANNEL_MICROPAY, DUMMY_POS_ID)
        found = False
        for msg in messages:
            if msg.get('event') != 'payment_result':
                continue
            if msg.get('data') != 'payment_result':
                continue



    def test_create_from_ui(self):
        """POS saves order and payment information to local cache
        and then tries upload it to odoo server via create_from_ui method"""
        pass
