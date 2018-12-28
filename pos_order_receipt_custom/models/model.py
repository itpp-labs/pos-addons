# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models, api


class PosCustomReceipt(models.Model):
    _inherit = "pos.custom_receipt"

    type = fields.Selection(selection_add=[('order_receipt', 'Order Receipt')])


class RestaurantPrinter(models.Model):
    _inherit = 'restaurant.printer'

    def _get_custom_order_receipt_id_domain(self):
        return [('type', '=', 'order_receipt')]

    custom_order_receipt = fields.Boolean(string="Custom Order Receipt", defaut=False)
    custom_order_receipt_id = fields.Many2one("pos.custom_receipt", string='Print Template',
                                              domain=lambda self: self._get_custom_order_receipt_id_domain())


class PosConfig(models.Model):
    _inherit = 'pos.config'

    print_transfer_info_in_kitchen = fields.Boolean(string='Print Order Transfer Ticket',
                                                    help='Print the kitchen ticket once the order is transfered to another table', default=True)
    custom_kitchen_receipt = fields.Boolean(compute='_compute_custom_kitchen_receipt', readonly=True, string='Using of Custom Kitchen Receipt')

    @api.depends('printer_ids')
    def _compute_custom_kitchen_receipt(self):
        custom_kitchen_receipt = False
        for p in self.printer_ids:
            if p.custom_order_receipt is True:
                custom_kitchen_receipt = True
                break
        self.custom_kitchen_receipt = custom_kitchen_receipt
