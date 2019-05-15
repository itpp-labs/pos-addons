# Copyright 2016 Stanislav Krotov <https://it-projects.info/team/ufaks>
# Copyright 2016 manawi <https://github.com/manawi>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import models, fields, api


class PosConfig(models.Model):
    _inherit = 'pos.config'

    @api.model
    def _default_negative_stock_user(self):
        return self.env.ref('point_of_sale.group_pos_manager')

    negative_order_group_id = fields.Many2one(
        'res.groups', string='Negative Order Group', default=_default_negative_stock_user,
        help='Group allows to sell products which are out of a stock.')


class PosOrder(models.Model):
    _inherit = "pos.order"

    negative_stock_user_id = fields.Many2one(
        'res.users', string='Negative stock approval',
        help="Person who authorized a sale with a product which is out of a stock")

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['negative_stock_user_id'] = ui_order['negative_stock_user_id']
        return res
