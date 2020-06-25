# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import api, fields, models

MODULE = "pos_wechat_miniprogram"


class PosConfig(models.Model):
    _inherit = "pos.config"

    allow_message_from_miniprogram = fields.Boolean(
        string="Allow receiving messages",
        help="Allow receiving messages from the WeChat mini-program",
        default=True,
    )
    auto_print_miniprogram_orders = fields.Boolean(
        string="Auto Print miniprogram Orders",
        help="Auto Print miniprogram order to kitchen",
        default=True,
    )

    @api.multi
    def open_session_cb(self):
        res = super(PosConfig, self).open_session_cb()
        self.init_pos_wechat_miniprogram_journal()
        return res

    def init_pos_wechat_miniprogram_journal(self):
        """Init demo Journals for current company"""
        # Multi-company is not primary task for this module, but I copied this
        # code from pos_debt_notebook, so why not
        journal_obj = self.env["account.journal"]
        user = self.env.user
        wechat_jsapi_journal_active = journal_obj.search(
            [("company_id", "=", user.company_id.id), ("wechat", "=", "jsapi")]
        )
        if wechat_jsapi_journal_active:
            return
        demo_is_on = self.env["ir.module.module"].search([("name", "=", MODULE)]).demo

        options = {
            "noupdate": True,
            "type": "cash",
            "write_statement": demo_is_on,
        }
        wechat_jsapi_journal = self._create_wechat_journal(
            dict(
                sequence_name="Wechat JSAPI Payment",
                prefix="WMPJSAPI-- ",
                journal_name="Wechat JSAPI Payment",
                code="WMPJSAPI",
                wechat="jsapi",
                **options
            )
        )

        if demo_is_on:
            self.write({"journal_ids": [(4, wechat_jsapi_journal.id)]})
