from odoo import models, fields, api, _

class Game(models.Model):
    _name = 'game'
    _description = 'Game fields'

    trump = fields.Integer()
    # session_ids = fields.One2many('pos.session', 'game_id')
    name = fields.Char()
