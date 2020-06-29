# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

try:
    from qcloudsms_py.httpclient import HTTPError
    import phonenumbers
except ImportError as err:
    _logger.debug(err)


class QCloudSMS(models.Model):
    """Records with information about SMS messages."""

    _name = "qcloud.sms"
    _description = "SMS Messages"
    _order = "id desc"

    STATE_SELECTION = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("done", "Delivered"),
        ("error", "Error"),
    ]

    partner_ids = fields.Many2many("res.partner", string="Partner")
    send_datetime = fields.Datetime(
        string="Sent",
        readonly=True,
        help="Date and Time of sending the message",
        default=fields.Datetime.now,
    )
    message = fields.Text(string="Message")
    state = fields.Selection(
        STATE_SELECTION,
        string="Status",
        readonly=True,
        default="draft",
        help="Status of the SMS message",
    )
    template_id = fields.Many2one("qcloud.sms.template", "SMS Template")
    sms_type = fields.Selection(
        [(0, "Normal"), (1, "Marketing")],
        string="SMS Type",
        default=0,
        help="Type of SMS message",
    )

    def _get_country(self, partner):
        if "country_id" in partner:
            return partner.country_id
        return self.env.user.company_id.country_id

    def _sms_sanitization(self, partner, number=None):
        number = number or partner.mobile
        if number:
            country = self._get_country(partner)
            country_code = country.code if country else None
            try:
                phone_nbr = phonenumbers.parse(
                    number, region=country_code, keep_raw_input=True
                )
            except phonenumbers.phonenumberutil.NumberParseException as e:
                raise UserError(_("Unable to parse %s:\n%s") % (number, e))

            if not phonenumbers.is_possible_number(
                phone_nbr
            ) or not phonenumbers.is_valid_number(phone_nbr):
                raise UserError(
                    _("Invalid number %s: probably incorrect prefix") % number
                )
            return phone_nbr
        else:
            raise UserError(
                _(
                    "Mobile phone number not specified for Partner: %s(id: %s)",
                    partner.name,
                    partner.id,
                )
            )

    @api.model
    def send_message(self, message, partner_id, sms_type=None, **kwargs):
        """
        Send single SMS message.

        :param message: SMS message content
        :param partner_id: id of partner to whom the message will be sent
        :param sms_type: SMS message type, 0 - normal SMS, 1 - marketing SMS
        :param kwargs: not required parameters, extend - extend field, default is empty string,
        ext - ext field, content will be returned by server as it is, url - custom url
        """
        try:
            result = self._send_message(message, partner_id, sms_type, **kwargs)
        except HTTPError as e:
            return {"error": _("Error on sending SMS: %s") % e.response.text}
        _logger.debug("Send message JSON result: %s", result)
        return result

    @api.model
    def _send_message(self, message, partner_id, sms_type, **kwargs):
        partner = self.env["res.partner"].browse(partner_id)
        vals = {
            "message": message,
            "partner_ids": partner,
            "sms_type": sms_type,
        }

        # create new record
        sms = self.create(vals)

        # get SMS object
        qcloudsms = self.env["ir.config_parameter"].sudo().get_qcloud_sms_object()
        ssender = qcloudsms.SmsSingleSender()

        try:
            phone_obj = self._sms_sanitization(partner)
        except UserError as e:
            sms.write({"state": "error"})
            _logger.debug(e)
            raise

        country_code = phone_obj.country_code
        national_number = phone_obj.national_number
        _logger.debug(
            "Country code: %s, Mobile number: %s", country_code, national_number
        )

        extend_field = kwargs.get("extend_field") or ""
        url = kwargs.get("url") or None

        result = ssender.send(
            sms.sms_type,
            country_code,
            national_number,
            message,
            extend=extend_field,
            ext=sms.id,
            url=url,
        )

        state = "sent" if result.get("result") == 0 else "error"
        sms.write({"state": state})
        result["sms_id"] = sms.id
        return result

    @api.model
    def send_group_message(self, message, partner_ids, sms_type=None, **kwargs):
        """
        Send a SMS messages to multiple partners at once.

        :param message: SMS message content
        :param partner_ids: ids of partners to whom the message will be sent
        :param sms_type: SMS message type, 0 - normal SMS, 1 - marketing SMS
        :param kwargs: not required parameters, extend - extend field, default is empty string,
        ext - ext field, content will be returned by server as it is, url - custom url
        """
        try:
            result = self._send_group_message(message, partner_ids, sms_type, **kwargs)
        except HTTPError as e:
            return {"error": _("Error on sending SMS: %s") % e.response.text}
        _logger.debug("Send group message JSON result: %s", result)
        return result

    @api.model
    def _send_group_message(self, message, partner_ids, sms_type, **kwargs):
        partners = self.env["res.partner"].browse(partner_ids)

        vals = {
            "message": message,
            "partner_ids": partners,
            "sms_type": sms_type,
        }

        # create new record
        sms = self.create(vals)

        # get SMS object
        qcloudsms = self.env["ir.config_parameter"].sudo().get_qcloud_sms_object()
        msender = qcloudsms.SmsMultiSender()

        try:
            phone_obj_list = map(self._sms_sanitization, partners)
        except UserError as e:
            sms.state = "error"
            _logger.debug(e)

        country_code_list = list(map(lambda x: x.country_code, phone_obj_list))
        country_code = list(set(country_code_list))

        if len(country_code) > 1:
            raise UserError(
                _("The country code must be the same for all phone numbers")
            )

        country_code = country_code[0]
        national_number_list = list(map(lambda x: x.national_number, phone_obj_list))

        _logger.debug(
            "Country code: %s, Mobile numbers: %s", country_code, national_number_list
        )

        extend_field = kwargs.get("extend_field") or ""
        url = kwargs.get("url") or None

        result = msender.send(
            sms.sms_type,
            country_code,
            national_number_list,
            message,
            extend=extend_field,
            ext=sms.id,
            url=url,
        )

        state = "sent" if result.get("result") == 0 else "error"
        sms.write({"state": state})
        result["sms_id"] = sms.id
        return result


class QCloudSMSTemplate(models.Model):
    """Templates of SMS messages."""

    _name = "qcloud.sms.template"
    _description = "SMS Templates"
    _order = "id desc"

    name = fields.Char(string="Name", help="The template name")

    domestic_sms_template_ID = fields.Integer(
        string="Domestic SMS Template ID",
        help="SMS Template ID is the Tencent Cloud SMS template (the specific content of the SMS message to be sent).",
    )
    domestic_template_params = fields.Text(
        string="Domestic Template parameters",
        help="Parameters must be separated by commas. If the template has no parameters, leave it empty.",
    )
    domestic_sms_sign = fields.Char(
        string="Domestic SMS Signature",
        help="SMS Signature is the Tencent Cloud SMS signature (an identifier added before the message body for "
        "identification of the company or business.).",
    )
    international_sms_template_ID = fields.Integer(
        string="International SMS Template ID",
        help="SMS Template ID is the Tencent Cloud SMS template (the specific content of the SMS message to be sent).",
    )
    international_template_params = fields.Text(
        string="International Template parameters",
        help="Parameters must be separated by commas. If the template has no parameters, leave it empty.",
    )
    international_sms_sign = fields.Char(
        string="International SMS Signature ID",
        help="SMS Signature is the Tencent Cloud SMS signature (an identifier added before the message body for "
        "identification of the company or business.).",
    )

    @api.multi
    def _get_sms_params_by_country_code(self, code):
        self.ensure_one()
        res = {}
        # China Country Code 86 (use domestics templates)
        if code == "86":
            res["template_ID"] = self.domestic_sms_template_ID or ""
            params = self.domestic_template_params or ""
            res["sign"] = self.domestic_sms_sign or ""
        else:
            res["template_ID"] = self.international_sms_template_ID or ""
            params = self.international_template_params or ""
            res["sign"] = self.international_sms_sign or ""

        res["template_params"] = params.split(",")

        return res

    @api.model
    def send_template_message(self, partner_id, template_id, **kwargs):
        """
        Send single SMS message with template paramters.

        :param partner_id: id of partner to whom the message will be sent
        :param template_id: id of template
        :param kwargs: not required parameters, extend - extend field, default is empty string,
        ext - ext field, content will be returned by server as it is, url - custom url
        """
        try:
            template = self.browse(template_id)
            result = template._send_template_message(partner_id, **kwargs)
        except HTTPError as e:
            return {"error": _("Error on sending Template SMS: %s") % e.response.text}
        _logger.debug("Send template message JSON result: %s", result)
        return result

    @api.multi
    def _send_template_message(self, partner_id, **kwargs):
        self.ensure_one()
        partner = self.env["res.partner"].browse(partner_id)

        vals = {
            "partner_ids": partner,
            "template_id": self.id,
        }

        # create new sms record
        sms_model = self.env["qcloud.sms"]
        sms_record = sms_model.create(vals)

        # get SMS object
        qcloudsms = self.env["ir.config_parameter"].sudo().get_qcloud_sms_object()
        ssender = qcloudsms.SmsSingleSender()

        try:
            phone_obj = sms_model._sms_sanitization(partner)
        except UserError as e:
            sms_record.write({"state": "error"})
            _logger.debug(e)
            raise

        country_code = phone_obj.country_code
        national_number = phone_obj.national_number

        _logger.debug(
            "Country code: %s, Mobile number: %s", country_code, national_number
        )

        params = self._get_sms_params_by_country_code(country_code)

        _logger.debug("SMS params: %s", params)

        extend_field = kwargs.get("extend_field") or ""
        url = kwargs.get("url") or None

        result = ssender.send_with_param(
            country_code,
            national_number,
            params.get("template_ID"),
            params.get("template_params"),
            sign=params.get("sign"),
            extend=extend_field,
            ext=sms_record.id,
            url=url,
        )

        state = "sent" if result.get("result") == 0 else "error"
        sms_record.write({"state": state})

        result["sms_id"] = sms_record.id
        return result

    @api.model
    def send_template_group_message(self, partner_ids, template_id, **kwargs):
        """
        Send a SMS messages with template parameters to multiple
        partners at once.

        :param partner_ids: ids of partners to whom the message will be sent
        :param template_id: id of template
        :param kwargs: not required parameters, extend - extend field, default is empty string,
        ext - ext field, content will be returned by server as it is, url - custom url
        """
        try:
            template = self.browse(template_id)
            result = template._send_template_group_message(partner_ids, **kwargs)
        except HTTPError as e:
            return {"error": _("Error on sending Template SMS: %s") % e.response.text}
        _logger.debug("Send template group message JSON result: %s", result)
        return result

    @api.multi
    def _send_template_group_message(self, partner_ids, **kwargs):
        self.ensure_one()
        partners = self.env["res.partner"].browse(partner_ids)

        vals = {
            "partner_ids": partners,
            "template_id": self.id,
        }

        # create new sms record
        sms_model = self.env["qcloud.sms"]
        sms_record = sms_model.create(vals)

        # get SMS object
        qcloudsms = self.env["ir.config_parameter"].sudo().get_qcloud_sms_object()
        msender = qcloudsms.SmsMultiSender()

        try:
            phone_obj_list = map(sms_model._sms_sanitization, partners)
        except UserError as e:
            sms_record.write({"state": "error"})
            _logger.debug(e)
            raise

        country_code_list = list(map(lambda x: x.country_code, phone_obj_list))
        country_code = list(set(country_code_list))

        if len(country_code) > 1:
            raise UserError(
                _("The country code must be the same for all phone numbers")
            )

        country_code = country_code[0]
        national_number_list = list(map(lambda x: x.national_number, phone_obj_list))

        _logger.debug(
            "Country code: %s, Mobile numbers: %s", country_code, national_number_list
        )

        params = self._get_sms_params_by_country_code(country_code)

        _logger.debug("SMS params: %s", params)

        extend_field = kwargs.get("extend_field") or ""
        url = kwargs.get("url") or None

        result = msender.send_with_param(
            country_code,
            national_number_list,
            params.get("template_ID"),
            params.get("template_params"),
            sign=params.get("sign"),
            extend=extend_field,
            ext=sms_record.id,
            url=url,
        )

        state = "sent" if result.get("result") == 0 else "error"
        sms_record.write({"state": state})

        result["sms_id"] = sms_record.id
        return result
