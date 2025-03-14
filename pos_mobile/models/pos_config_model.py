# Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    auto_mobile = fields.Boolean(
        "Auto Mobile View",
        help="Switch to Mobile view automatically depending on device",
        default=True,
    )
    force_mobile = fields.Boolean(
        "Force Mobile View",
        help="Force switch to Mobile view",
        default=False,
    )
