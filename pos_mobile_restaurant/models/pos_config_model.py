# -*- coding: utf-8 -*-

import logging

from odoo import fields, models

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = "pos.config"

    show_number_guests = fields.Boolean(
        string="Show the number of guests",
        help="Show the number of guests in popup for empty table",
        default=True,
    )
