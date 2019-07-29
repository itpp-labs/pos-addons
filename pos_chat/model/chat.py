from odoo import models, fields, api, _

class Chat(models.Model):
    _name = 'pos.chat'

    name = fields.Char(string='Name')
    maxUsers = fields.Integer()

