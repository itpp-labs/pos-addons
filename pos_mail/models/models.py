# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import base64
from odoo import models, fields, api


class PosConfig(models.Model):
    _inherit = 'pos.config'

    send_receipt_by_mail = fields.Boolean('Mail a Receipt')

    @api.model
    def send_receipt_via_mail(self, partner_id, body_from_ui, pos_reference):
        base64_pdf = self.env['ir.actions.report']._run_wkhtmltopdf(
            [body_from_ui.encode('utf-16')],
            landscape=False,
            specific_paperformat_args={'data-report-margin-top': 10, 'data-report-header-spacing': 10}
        )
        attachment = self.env['ir.attachment'].create({
            'name': pos_reference,
            'datas_fname': pos_reference + '.pdf',
            'type': 'binary',
            'db_datas': base64.encodestring(base64_pdf),
            'res_model': 'res.partner',
            'res_id': partner_id,
        })

        partner = self.env['res.partner'].browse(partner_id)
        mail_body = 'Receipt from ' + self.env.user.company_id.name + '\n'
        mail_body += self.env["ir.config_parameter"].sudo().get_param("pos_mail.mail_message", default='')
        # wizard model creation
        composer = self.env['mail.compose.message'].create({
            'partner_ids': [(6, False, [partner.id])],
            'attachment_ids': [(6, False, [attachment.id])],
            'notify': True,
            'body': mail_body,
        })

        composer.send_mail()
        return True


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    mail_message = fields.Text('Mail Message Template')

    @api.multi
    def set_values(self):
        super(ResConfigSettings, self).set_values()
        config_parameters = self.env["ir.config_parameter"].sudo()
        for record in self:
            config_parameters.sudo().set_param("pos_mail.mail_message", record.mail_message)

    @api.multi
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        config_parameters = self.env["ir.config_parameter"].sudo()
        mail_message = config_parameters.sudo().get_param("pos_mail.mail_message", default='')
        res.update(
            mail_message=mail_message,
        )
        return res
