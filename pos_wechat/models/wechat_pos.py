# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import api, fields, models

CHANNEL_WECHAT = "wechat"


class WeChatPos(models.AbstractModel):
    _name = "wechat.pos"

    pos_id = fields.Many2one("pos.config")

    @api.multi
    def _send_pos_notification(self):
        self.ensure_one()
        msg = self._prepare_message()
        assert self.pos_id, "The record has empty value of pos_id field"
        return self.env["pos.config"]._send_to_channel_by_id(
            self._cr.dbname, self.pos_id.id, CHANNEL_WECHAT, msg
        )
