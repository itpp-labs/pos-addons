# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
from odoo import fields, models


class ResUsers(models.Model):
    _inherit = 'res.users'

    allow_decrease_kitchen_only = fields.Boolean('Allow change Qty for kitchen orders', default=True)
    allow_remove_kitchen_order_line = fields.Boolean('Allow remove kitchen order line', default=True)
