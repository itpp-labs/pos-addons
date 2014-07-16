# -*- coding: utf-8 -*-
import werkzeug

from openerp import SUPERUSER_ID
from openerp.addons.web import http
from openerp.addons.web.http import request
from openerp.tools.translate import _
from openerp.addons.website.models.website import slug

class CheckoutError(Exception):
    pass

class pos_website_sale(http.Controller):
    @http.route(['/shop/get_order_numbers'], type='json', auth="public", website=True)
    def get_order_numbers(self):
        res = {}
        order = request.website.sale_get_order()
        for line in order.website_order_line:
            res[line.product_id.id] = line.product_uom_qty
        return res

    @http.route(['/shop/checkout'], type='http', auth='public', website=True)
    def shop_checkout(self, contact_name=None, email_from=None):
        post = {
            'contact_name':contact_name or email_from,
            'email_from':email_from
            }

        error = set(field for field in ['email_from']
                    if not post.get(field))

        values = dict(post, error=error)
        if error:
            return request.website.render("website_sale.checkout", values)

        ## find or create partner
        partner_obj = request.registry['res.partner']

        partner_id = partner_obj.search(request.cr, SUPERUSER_ID, [('email', '=', values['email_from'])])
        if partner_id:
            if isinstance(partner_id, list):
                if len(partner_id)>1:
                    raise CheckoutError('Multiple users with same email')
                else:
                    partner_id = partner_id[0]

        partner_id = partner_obj.create(request.cr, SUPERUSER_ID,
                                        {'name':values['contact_name'],
                                         'email':values['email_from']})

        order = request.website.sale_get_order()
        #order_obj = request.registry.get('sale.order')
        order.write({'partner_id':partner_id})

        ## send email
        cr = request.cr
        uid = request.uid
        context = request.context
        ir_model_data = request.registry['ir.model.data']
        try:
            template_id = ir_model_data.get_object_reference(cr, uid, 'pos_website_sale', 'email_template_checkout')[1]
        except ValueError:
            template_id = False
        email_ctx = dict(context)
        email_ctx.update({
            'default_model': 'sale.order',
            'default_res_id': order.id,
            'default_use_template': bool(template_id),
            'default_template_id': template_id,
            'default_composition_mode': 'comment',
            'mark_so_as_sent': True
        })
        composer_values = {}
        public_id = request.website.user_id.id
        if uid == public_id:
            composer_values['email_from'] = request.website.user_id.company_id.email
        composer_id = request.registry['mail.compose.message'].create(cr, SUPERUSER_ID, composer_values, context=email_ctx)
        request.registry['mail.compose.message'].send_mail(cr, SUPERUSER_ID, [composer_id], context=email_ctx)


        return request.redirect('/shop/ready')

    @http.route(['/shop/ready'], type='http', auth='public', website=True)
    def shop_ready(self):
        values={}
        return request.website.render('pos_website_sale.ready', values)
