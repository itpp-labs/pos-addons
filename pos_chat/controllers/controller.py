from lxml import etree
import logging

from odoo import http
from odoo.http import request

class MyController(odoo.http.Controller):

    @http.route('/', auth='public')
    def handler(self):
        return "Hello"
