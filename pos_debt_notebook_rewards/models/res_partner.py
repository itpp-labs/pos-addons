# -*- coding: utf-8 -*-
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import models, api


class Partner(models.Model):
    _inherit = 'res.partner'

    @api.model
    def name_search(self, name, args=None, operator='ilike', limit=100):
        if args is None:
            args = []
        if self.env.context.get('barcode_search'):
            return self.search(args + ['|', ('name', operator, name), ('barcode', operator, name)], limit=limit).name_get()

        return super(Partner, self).name_search(name, args=args, operator=operator, limit=limit)
