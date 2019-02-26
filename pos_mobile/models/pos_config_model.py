# Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import models, fields


class PosConfig(models.Model):
    _inherit = 'pos.config'

    auto_mobile = fields.Boolean("Auto Mobile View", help="Switch to Mobile view automatically depending on device",
                                 default=True)
