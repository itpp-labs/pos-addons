# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class Micropay(models.Model):

    _name = 'wechat.micropay'

    terminal_ref = fields.Char('Terminal Reference', help='e.g. POS Name')
    result_raw = fields.Text('Raw result')

    @api.model
    def _body(self, terminal_ref, **kwargs):
        return "%s - Products" % terminal_ref

    @api.model
    def create_from_qr(self, body, auth_code, total_fee, terminal_ref=None, create_vals=None, **kwargs):
        """
        :param product_category: is used to prepare "body"
        :param total_fee: Specifies the total order amount. The units are expressed in cents as integers.
        :param create_vals: extra args to pass on record creation
        """
        wpay = self.env['ir.config_parameter'].get_wechat_pay_object()
        result_json = wpay.micropay.create(
            body,
            total_fee,
            auth_code,
        )

        _logger.debug('result_raw', result_json)
        vals = {
            'terminal_ref': terminal_ref,
            'result_raw': result_json.dumps(),
        }
        if create_vals:
            vals.update(create_vals)
        record = self.create(vals)
        return record
