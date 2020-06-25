from odoo import api, models


class IrAttachment(models.Model):
    _inherit = "ir.attachment"

    @api.model
    def check(self, mode, values=None):
        ids = []
        if self.ids:
            ids = self.ids[:]  # copy
            self.env.cr.execute(
                "SELECT id,res_model FROM ir_attachment WHERE id = ANY (%s)", (ids,)
            )
            for id, res_model in self.env.cr.fetchall():
                if res_model in ["product.template", "product.product"]:
                    ids.remove(id)
            if not ids:
                return
        return super(IrAttachment, self.browse(ids)).check(mode, values)
