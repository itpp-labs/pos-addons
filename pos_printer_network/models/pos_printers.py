# -*- coding: utf-8 -*-
import logging
from odoo import models, fields

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'restaurant.printer'

    network_printer = fields.Boolean(default=False, string='Network Printer', help="Check this box if this printer is Network printer")


class PosConfig(models.Model):
    _inherit = 'pos.config'

    receipt_network_printer_ip = fields.Char(default=False, string="Receipt Network Printer IP", help="The ip address of the network printer for receipt, unused if left empty")
    network_printer = fields.Boolean(default=False, string="Network Printer", help="Check the box to use Network printers")
    usb_printer_active = fields.Boolean(default=False, string="USB Printer", help="Check the box to use USB printers")
