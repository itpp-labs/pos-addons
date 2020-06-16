from odoo import api, fields, models


class PosOrder(models.Model):
    _inherit = "pos.order"

    employee_cashier_id = fields.Many2one("hr.employee", string="Cashier")

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res["employee_cashier_id"] = ui_order["employee_cashier_id"]
        return res


class PosConfig(models.Model):
    _inherit = "pos.config"

    employee_cashier_ids = fields.Many2many(
        "hr.employee",
        string="Cashiers with access",
        help="If left empty, all cashiers can log in to the PoS session",
    )
