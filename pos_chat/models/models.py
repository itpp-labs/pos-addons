# -*- coding: utf-8 -*-
# Copyright 2017, XOE Corp.
# XOE Enterprise Edition License v1.0.

from odoo import models, fields, api, _  # noqa


# class pos_chat(models.Model):
#     _name = 'pos_chat.pos_chat'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         self.value2 = float(self.value) / 100