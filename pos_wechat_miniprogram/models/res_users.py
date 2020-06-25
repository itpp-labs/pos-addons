# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api, fields, models

_logger = logging.getLogger(__name__)

try:
    import phonenumbers
except ImportError as err:
    _logger.debug(err)


class Users(models.Model):
    _inherit = "res.users"

    @api.model
    def wechat_mobile_number_verification(self, data):
        return self.env.user.partner_id._wechat_mobile_number_verification(data)


class ResPartner(models.Model):
    _inherit = "res.partner"

    number_verified = fields.Boolean(string="Verified", default=False)

    @api.multi
    def _wechat_mobile_number_verification(self, data):
        """
        Save WeChat mobile number

        :param data: data['encryptedData'] Encrypted data with complete user information including sensitive data
        :param data: data['iv'] Initial vector of the encryption algorithm
        :return result: result of wechat phone number verification
        """
        self.ensure_one()

        encryptedData = data.get("encryptedData")
        iv = data.get("iv")
        session_key = self.wechat_session_key
        res = (
            self.env["ir.config_parameter"]
            .sudo()
            .decrypt_wechat_miniprogram_data(session_key, encryptedData, iv)
        )
        PhoneNumber = res.get("phoneNumber")
        country = self._get_country()
        country_code = country.code if country else None
        phone_obj = phonenumbers.parse(
            PhoneNumber, region=country_code, keep_raw_input=True
        )
        phone_number = phonenumbers.format_number(
            phone_obj, phonenumbers.PhoneNumberFormat.INTERNATIONAL
        )
        self.write({"mobile": phone_number, "number_verified": True})
        return {"result": True}

    @api.multi
    def _get_country(self):
        self.ensure_one()
        if self.country_id:
            return self.country_id
        return self.env.user.company_id.country_id
