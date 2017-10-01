# -*- coding: utf-8 -*-
from odoo import models, api


class PosConfig(models.Model):
    _inherit = 'pos.config'

    # Methods to open the POS
    @api.multi
    def open_ui(self):
        res = super(PosConfig, self).open_ui()
        context = dict(self._context)
        mobile_version = context.get('mobile') or False
        if mobile_version:
            res['url'] = '/pos/web/?m=1'
        return res

    @api.multi
    def open_existing_session_cb(self):
        res = super(PosConfig, self).open_existing_session_cb()
        context = dict(self._context)
        mobile_version = context.get('mobile') or False
        if mobile_version:
            res['url'] = '/pos/web/?m=1'
        return res
