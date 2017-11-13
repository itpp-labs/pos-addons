
import time
import math

from odoo.osv import expression
from odoo.tools.float_utils import float_round as round, float_is_zero as is_zero
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from odoo.exceptions import UserError, ValidationError
from odoo import api, fields, models, _


class AccountJournal(models.Model):
    _inherit = "account.journal"

    wechat_payment = fields.Boolean(string='Allow WeChat payments', default=False,
        help="Check this box if this account allows pay via WeChat")
    smth_new_from_qr = fields.Boolean(string='Allow WeChat payments', default=False,
        help="Test field before I understand what should be here")