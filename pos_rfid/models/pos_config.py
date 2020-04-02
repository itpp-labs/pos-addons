# -*- coding: utf-8 -*-
# Copyright 2020 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models, _


class PosConfig(models.Model):
    _inherit = 'pos.config'

    pos_rfid = fields.Boolean('HEX Barcode')
