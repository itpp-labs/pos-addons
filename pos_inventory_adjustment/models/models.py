# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import api, fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    def _get_group_system(self):
        return self.env.ref("base.group_system")

    inventory_adjustment = fields.Boolean("Inventory Mode")
    inventory_adjustment_temporary_inv_id = fields.Many2one(
        "stock.inventory.stage", "Temporary POS"
    )
    group_system_id = fields.Many2one(
        "res.groups",
        string="System Group",
        default=_get_group_system,
        help="This field is there to pass the id of the system group to the point of sale client",
    )

    @api.multi
    def create_temporary_inventory(self, stock_inventory_stage_id):
        stock_inventory_stage_id = self.env["stock.inventory.stage"].browse(
            stock_inventory_stage_id
        )
        return self.create(
            {
                "name": stock_inventory_stage_id.name + "POS",
                "stock_location_id": stock_inventory_stage_id.inventory_id.location_id.id,
                "inventory_adjustment": True,
                "inventory_adjustment_temporary_inv_id": stock_inventory_stage_id.id,
            }
        )

    def close_and_validate_entries_on_pos_closing(self, session):
        session = self.env["pos.session"].browse(session)
        session.action_pos_session_close()
        if session.config_id.inventory_adjustment_temporary_inv_id:
            config_id = session.config_id
            session.action_pos_session_close()
            session.statement_ids.button_cancel()
            session.sudo().unlink()
            config_id.sudo().unlink()


class StockInventoryStage(models.Model):
    _inherit = "stock.inventory.stage"

    def update_stage_from_ui(self, data):
        stage_line_model = self.env["stock.inventory.stage.line"]
        if self.state == "done":
            return {
                "error": {
                    "title": "Inventory Stage Status Error",
                    "message": "Inventory Stage Was Already Done",
                }
            }
        # we restrict line deletion for users without rights from the POS interface
        self.line_ids.sudo().unlink()
        for line in data["lines"]:
            product_id = line["product_id"]
            qty = line["qty"]
            same_produt_line = self.line_ids.filtered(
                lambda l: l.product_id.id == product_id
            )
            if same_produt_line:
                same_produt_line.write({"qty": same_produt_line.qty + qty})
            else:
                stage_line_model.create(
                    {"stage_id": self.id, "product_id": product_id, "qty": qty}
                )
        # self.action_stage_done()
        return {
            "inventory_stage_id": self.id,
        }


class StockInventory(models.Model):
    _inherit = "stock.inventory"

    @api.multi
    def action_new_stage(self):
        opened_poses = self.env["pos.session"].search(
            [("user_id", "=", self.env.user.id), ("state", "=", "opened")]
        )
        if opened_poses:
            return opened_poses[0].open_frontend_cb()

        res = super(StockInventory, self).action_new_stage()
        config = self.env["pos.config"].create_temporary_inventory(res["res_id"])
        config.open_session_cb()
        return config.current_session_id.open_frontend_cb()
