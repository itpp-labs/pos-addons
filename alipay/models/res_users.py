# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api, fields, models
from odoo.exceptions import AccessDenied

_logger = logging.getLogger(__name__)


class ResUsers(models.Model):
    _inherit = "res.users"

    openid = fields.Char("Openid")
    alipay_session_key = fields.Char("Alipay session key")

    @api.model
    def check_credentials(self, password):
        try:
            return super(ResUsers, self).check_credentials(password)
        except AccessDenied:
            res = self.sudo().search(
                [("id", "=", self.env.uid), ("alipay_session_key", "=", password)]
            )
            if not res:
                raise
