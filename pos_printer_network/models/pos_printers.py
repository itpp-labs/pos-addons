# -*- coding: utf-8 -*-
import logging
from odoo import models, fields

_logger = logging.getLogger(__name__)


class RestaurantPrinter(models.Model):
    _inherit = 'restaurant.printer'

    proxy_ip = fields.Char('IP Address', help="IP Address of PosBox if it's USB Printer"
                                              "or IP Address Network Printer otherwise")
    network_printer = fields.Boolean(default=False, string='Network Printer', help="Check this box if this printer is Network printer")


class PosConfig(models.Model):
    _inherit = 'pos.config'

    receipt_printer_type = fields.Selection([
        ('usb_printer', 'USB Printer'),
        ('network_printer', 'Network Printer')], "Printer Type",
        default='usb_printer', required=True,
        help="Select the printer type you want to use receipt printing")
    receipt_network_printer_ip = fields.Char(default=False, string="Network Printer IP", help="IP address of the network printer used for receipts")
