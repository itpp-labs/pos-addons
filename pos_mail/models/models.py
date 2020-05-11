# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License MIT (https://opensource.org/licenses/MIT).

import base64
import re
from html.parser import HTMLParser

from odoo import api, fields, models, tools

try:
    from odoo.addons.mail.models.mail_template import mako_template_env
except ImportError:
    pass


TAG_WHITELIST = [
    "p",
    "img",
]


class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.fed = []

    def get_data(self):
        return "".join(self.fed)

    def handle_starttag(self, tag, attrs):
        if tag not in TAG_WHITELIST:
            return
        if tag == "img":
            self.fed.append("<%s " % tag)
            attrs = dict(attrs)
            if attrs.get("src"):
                value = attrs["src"]
                pttrn = re.compile(r"b\'(.*?)'")
                if pttrn.search(value):
                    repl = pttrn.search(value).group(1)
                    value = value.replace(pttrn.search(value).group(0), repl)
                self.fed.append('src="%s"' % value)
            self.fed.append(">")
        else:
            self.fed.append("<%s>" % tag)

    def handle_endtag(self, tag):
        if tag in TAG_WHITELIST:
            self.fed.append("</%s>" % tag)

    def handle_data(self, data):
        self.fed.append(data)


def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()


class PosConfig(models.Model):
    _inherit = "pos.config"

    send_receipt_by_mail = fields.Boolean("Mail a Receipt")

    @api.model
    def action_set_true_send_via_mail(self):
        self.env["pos.config"].search([]).write({"send_receipt_by_mail": True})
        return True

    @api.model
    def render_body_html(self, template, partner, order):
        mako = mako_template_env.from_string(tools.ustr(template))
        html = mako.render({"partner": partner, "order": order})
        html = strip_tags(html)
        return html

    @api.model
    def send_receipt_via_mail(self, partner_id, body_from_ui, pos_reference):
        base64_pdf = self.env["ir.actions.report"]._run_wkhtmltopdf(
            [body_from_ui.encode("utf-16")],
            landscape=False,
            specific_paperformat_args={
                "data-report-margin-top": 10,
                "data-report-header-spacing": 10,
            },
        )
        attachment = self.env["ir.attachment"].create(
            {
                "name": pos_reference,
                "datas_fname": pos_reference + ".pdf",
                "type": "binary",
                "db_datas": base64.encodestring(base64_pdf),
                "res_model": "res.partner",
                "res_id": partner_id,
            }
        )
        partner = self.env["res.partner"].browse(partner_id)
        order = self.env["pos.order"].search([("pos_reference", "=", pos_reference)])
        mail_template_id = int(
            self.env["ir.config_parameter"]
            .sudo()
            .get_param("pos_mail.mail_message", default="")
        )
        body_template = self.env["mail.template"].browse(mail_template_id).body_html
        mail_body = self.render_body_html(body_template, partner, order)
        # wizard model creation
        composer = self.env["mail.compose.message"].create(
            {
                "partner_ids": [(6, False, [partner.id])],
                "attachment_ids": [(6, False, [attachment.id])],
                "notify": True,
                "body": mail_body,
            }
        )

        composer.send_mail()
        return True


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    mail_message = fields.Many2one(
        "mail.template",
        string="Mail Message Template",
        help="Keep empty to edit template manually",
    )

    @api.multi
    def set_values(self):
        super(ResConfigSettings, self).set_values()
        config_parameters = self.env["ir.config_parameter"].sudo()
        for record in self:
            config_parameters.sudo().set_param(
                "pos_mail.mail_message", record.mail_message.id
            )

    @api.multi
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        config_parameters = self.env["ir.config_parameter"].sudo()
        mail_message = config_parameters.sudo().get_param(
            "pos_mail.mail_message", default=""
        )
        res.update(mail_message=int(mail_message),)
        return res
