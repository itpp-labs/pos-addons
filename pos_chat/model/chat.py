from odoo import models, fields, api, _

class Chat(models.Model):
    _name = 'chat.new'

    name = fields.Char(string='Name')
    maxUsers = fields.Integer()

