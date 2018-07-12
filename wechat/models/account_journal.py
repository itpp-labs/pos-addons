# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields


class Journal(models.Model):
    _inherit = 'account.journal'

    wechat = fields.Selection([
        ('micropay', 'Scanning customer\'s QR'),
        ('native', 'Showing QR to customer'),
    ], string='WeChat Payment', help='Register for WeChat payment')
