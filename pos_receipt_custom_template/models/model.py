# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models


class PosCustomReceipt(models.Model):
    _name = "pos.custom_receipt"

    name = fields.Char('Name')
    type = fields.Selection(string="Type", selection=[('receipt', 'Receipt'), ('ticket', 'Ticket')])
    qweb_template = fields.Text('Qweb')


class PosConfig(models.Model):
    _inherit = 'pos.config'

    def _get_custom_ticket_id_domain(self):
        return [('type', '=', 'ticket')]

    def _get_custom_xml_receipt_id_domain(self):
        return [('type', '=', 'receipt')]

    show_second_product_name_in_receipt = fields.Boolean(string="Display Second Product Name", default=False)
    show_discount_in_receipt = fields.Boolean(string="Display discount on the ticket", default=True,
                                              help="Check box if you want to display the discount "
                                                   "of the orderline on the ticket")

    custom_ticket = fields.Boolean(string="Custom", defaut=False)
    custom_ticket_id = fields.Many2one("pos.custom_receipt", string="Custom Template",
                                       domain=lambda self: self._get_custom_ticket_id_domain())

    custom_xml_receipt = fields.Boolean(string="Custom PosBox Receipt", defaut=False)
    custom_xml_receipt_id = fields.Many2one("pos.custom_receipt", string="Custom PosBox Receipt Template",
                                            domain=lambda self: self._get_custom_xml_receipt_id_domain())


class ProductTemplate(models.Model):
    _inherit = "product.template"

    second_product_name = fields.Char(string="Second Product Name")
