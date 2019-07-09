# -*- coding: utf-8 -*-
# Copyright 2017, XOE Corp.
# XOE Enterprise Edition License v1.0.

from odoo import http


# class PosChat(http.Controller):
#     @http.route('/pos_chat/pos_chat/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/pos_chat/pos_chat/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('pos_chat.listing', {
#             'root': '/pos_chat/pos_chat',
#             'objects': http.request.env['pos_chat.pos_chat'].search([]),
#         })

#     @http.route('/pos_chat/pos_chat/objects/<model("pos_chat.pos_chat"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('pos_chat.object', {
#             'object': obj
#         })