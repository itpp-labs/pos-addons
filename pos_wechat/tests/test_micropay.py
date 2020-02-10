# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging

from odoo.addons.point_of_sale.tests.common import TestPointOfSaleCommon

try:
    from unittest.mock import patch
except ImportError:
    from mock import patch



_logger = logging.getLogger(__name__)
DUMMY_AUTH_CODE = "134579302432164181"
DUMMY_POS_ID = 1


# TODO clean this up: no need to use HttpCase. Also some helpers are not used.
class TestMicropay(TestPointOfSaleCommon):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestMicropay, self).setUp()

        # create wechat journals
        self.pos_config.init_pos_wechat_journals()

        # patch wechat
        patcher = patch("wechatpy.pay.base.BaseWeChatPayAPI._post", wraps=self._post)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _post(self, url, data):
        MICROPAY_URL = "pay/micropay"
        self.assertEqual(url, MICROPAY_URL)
        _logger.debug("Request data for %s: %s", MICROPAY_URL, data)

        # see wechatpy/client/base.py::_handle_result for expected result
        # format and tricks that are applied on original _post method
        result = {
            "return_code": "SUCCESS",
            "result_code": "SUCCESS",
            "openid": "123",
            "total_fee": 123,
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

        journal = self.env["account.journal"].search([("wechat", "=", "micropay")])

        # make request with scanned qr code (auth_code)
        msg = self.env["wechat.micropay"].pos_create_from_qr_sync(
            **{
                "auth_code": DUMMY_AUTH_CODE,
                "terminal_ref": "POS/%s" % DUMMY_POS_ID,
                "pos_id": DUMMY_POS_ID,
                "journal_id": journal.id,
                "pay_amount": 1,
            }
        )
        self.assertEqual(
            msg.get("result_code"),
            "SUCCESS",
            "Wrong result_code. The patch doesn't work?",
        )
