# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from wechatpy import WeChatPay

from odoo import models, fields, api


class Param(models.Model):

    _name = 'ir.config_parameter'

    @api.model
    def get_wechat_pay_object(self):

        return WeChatPay(
            self.get_param('wechat.app_id'),
            self.get_param('wechat.app_secret'),
            self.get_param('wechat.vendor_id'),
            sandbox=self.get_param('wechat.sandbox', '0') != '0',
            # TODO rest args
            # self.sub_mch_id = sub_mch_id
            # self.mch_cert = mch_cert
            # self.mch_key = mch_key
            # self.timeout = timeout
        )
