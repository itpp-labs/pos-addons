 # -*- coding: utf-8 -*-
from openerp.osv import osv,fields
from openerp import SUPERUSER_ID

class res_partner(osv.Model):
    _inherit = 'res.partner'

    def _get_debt(self, cr, uid, ids, field_name, arg, context=None):
        obj_data = self.pool.get('ir.model.data')
        debt_account_id = obj_data.get_object_reference(cr, uid, 'pos_debt_notebook', 'debt_account')[1]

        cr.execute("""SELECT l.partner_id, SUM(l.debit-l.credit)
                      FROM account_move_line l
                      WHERE l.account_id = %s
                      AND l.partner_id IN %s
                      GROUP BY l.partner_id
                      """,
                   (debt_account_id, tuple(ids),))
        print '_get_debt', debt_account_id
        res = {}
        for id in ids:
            res[id] = 0
        for id,val in cr.fetchall():
            res[id] = val or 0
        return res

    _columns = {
        'debt':fields.function(_get_debt, type='float', string='Debt'),
    }

