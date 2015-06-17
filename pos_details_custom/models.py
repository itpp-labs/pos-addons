from openerp import api, models, fields, SUPERUSER_ID
from openerp.addons.point_of_sale.report.pos_details import pos_details

class pos_details_custom(pos_details):

    def _pos_sales_details(self, form):
        pos_obj = self.pool.get('pos.order')
        user_obj = self.pool.get('res.users')
        data = []
        result = {}
        user_ids = form['user_ids'] or self._get_all_users()
        company_id = user_obj.browse(self.cr, self.uid, self.uid).company_id.id
        res = self.pool.get('report.pos.order').read_group(groupby=["product_categ_id"], fields=["product_categ_id", "product_qty", "price_total"], domain=[('date','>=',form['date_start'] + ' 00:00:00'),('date','<=',form['date_end'] + ' 23:59:59'),('user_id','in',user_ids),('state','in',['done','paid','invoiced']),('company_id','=',company_id)])
        print 'res', res
        return res

    def __init__(self, cr, uid, name, context):
        super(pos_details, self).__init__(cr, uid, name, context=context)
        self.localcontext.update({
            'pos_sales_details_custom':self._pos_sales_details_custom,
        })
