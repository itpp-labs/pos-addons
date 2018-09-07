# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    return_orders = fields.Boolean("Return Orders", help="Return Orders to POS", default=True)
    show_returned_orders = fields.Boolean("Show Returned Orders",  help="Show Returned Orders in History", default=False)
