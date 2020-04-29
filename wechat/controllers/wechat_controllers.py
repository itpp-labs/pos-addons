# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from lxml import etree

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class WechatController(http.Controller):
    @http.route(
        "/wechat/callback", methods=["POST"], auth="public", type="http", csrf=False
    )
    def wechat_callback(self):
        xml_raw = request.httprequest.get_data().decode(request.httprequest.charset)
        _logger.debug(
            "/wechat/callback request data: %s\nheaders %s: ",
            xml_raw,
            request.httprequest.headers,
        )

        # convert xml to object
        xml = etree.fromstring(xml_raw)
        data = {}
        for child in xml:
            data[child.tag] = child.text

        res = request.env["wechat.order"].sudo().on_notification(data)

        if res is not False:
            return """<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>"""
        else:
            return """<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Signature failure]]></return_msg></xml>"""
