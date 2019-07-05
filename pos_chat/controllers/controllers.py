# -*- coding: utf-8 -*-
# Copyright 2017, XOE Corp.
# XOE Enterprise Edition License v1.0.

from odoo import http


# class EmptyModule(http.Controller):
#     @http.route('/empty_module/empty_module/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/empty_module/empty_module/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('empty_module.listing', {
#             'root': '/empty_module/empty_module',
#             'objects': http.request.env['empty_module.empty_module'].search([]),
#         })

#     @http.route('/empty_module/empty_module/objects/<model("empty_module.empty_module"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('empty_module.object', {
#             'object': obj
#         })