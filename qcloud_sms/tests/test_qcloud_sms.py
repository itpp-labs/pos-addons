# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api
from odoo.tests.common import HttpCase

try:
    from unittest.mock import patch
except ImportError:
    from mock import patch


_logger = logging.getLogger(__name__)


class TestQCloudSMS(HttpCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestQCloudSMS, self).setUp()
        self.phantom_env = api.Environment(self.registry.test_cr, self.uid, {})
        self.Message = self.phantom_env["qcloud.sms"]
        self.partner_1 = self.phantom_env.ref("base.res_partner_1")
        self.partner_2 = self.phantom_env.ref("base.res_partner_2")
        self.partner_1.write({"mobile": "+1234567890"})
        self.partner_2.write({"mobile": "+1987654320"})
        self.Template = self.phantom_env["qcloud.sms.template"].create(
            {
                "name": "Test Template",
                "international_sms_template_ID": 123456,
                "international_template_params": "1,2,3,4,5",
                "international_sms_sign": "Test LLC",
            }
        )
        # add patch for phonenumbers
        patcher_possible_number = patch(
            "phonenumbers.is_possible_number", wraps=lambda *args: True
        )
        patcher_possible_number.start()
        self.addCleanup(patcher_possible_number.stop)

        patcher_valid_number = patch(
            "phonenumbers.is_valid_number", wraps=lambda *args: True
        )
        patcher_valid_number.start()
        self.addCleanup(patcher_valid_number.stop)

        # add patch for qcloudsms_py request
        response_json = {
            "result": 0,
            "errmsg": "OK",
            "ext": "",
            "fee": 1,
            "sid": "xxxxxxx",
        }
        self._patch_post_requests(response_json)

    def _patch_post_requests(self, response_json):
        def api_request(req, httpclient=None):
            _logger.debug("Request data: req - %s, httpclient - %s", req, httpclient)
            return response_json

        patcher = patch("qcloudsms_py.util.api_request", wraps=api_request)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_send_message(self):
        message = (
            "Your login verification code is 1234, which is valid for 2 minutes."
            "If you are not using our service, ignore the message."
        )
        response = self.Message.send_message(message, self.partner_1.id)
        self.assertEquals(response.get("result"), 0, "Could not send message")

    def test_send_group_message(self):
        message = "Discount for all products 50%!"
        response = self.Message.send_group_message(
            message, [self.partner_1.id, self.partner_2.id], sms_type=1
        )
        self.assertEquals(response.get("result"), 0, "Could not send group message")

    def test_send_template_message(self):
        response = self.Template.send_template_message(
            self.partner_1.id, self.Template.id
        )
        self.assertEquals(response.get("result"), 0, "Could not send template message")

    def test_send_template_group_message(self):
        response = self.Template.send_template_group_message(
            [self.partner_1.id, self.partner_2.id], self.Template.id
        )
        self.assertEquals(
            response.get("result"), 0, "Could not send template group message"
        )
