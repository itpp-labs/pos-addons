# -*- coding: utf-8 -*-
from openerp import models
from openerp.addons.point_of_sale.report.pos_details import pos_details


class PosDetailsCustom(pos_details):

    def _pos_sales_details_custom(self, form):
        user_obj = self.pool.get('res.users')
        user_ids = form['user_ids'] or self._get_all_users()
        company_id = user_obj.browse(self.cr, self.uid, self.uid).company_id.id
        res = self.pool.get('report.pos.order').read_group(self.cr, self.uid, groupby=["product_categ_id"], fields=["product_categ_id", "product_qty", "price_total", 'total_discount'], domain=[('date', '>=', form['date_start'] + ' 00:00:00'), ('date', '<=', form['date_end'] + ' 23:59:59'), ('user_id', 'in', user_ids), ('state', 'in', ['done', 'paid', 'invoiced']), ('company_id', '=', company_id)])
        for r in res:
            self.qty += r['product_qty']
            self.total += r['price_total']
            self.discount += r['total_discount']
        return res

    def __init__(self, cr, uid, name, context):
        super(PosDetailsCustom, self).__init__(cr, uid, name, context=context)
        self.localcontext.update({
            'pos_sales_details_custom': self._pos_sales_details_custom,
        })


class ReportPosDetails(models.AbstractModel):
    _inherit = 'report.point_of_sale.report_detailsofsales'
    _wrapped_report_class = PosDetailsCustom
