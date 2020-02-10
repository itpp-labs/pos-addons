# -*- coding: utf-8 -*-
from odoo import api, models

CHANNEL = "pos_debt_notebook_sync"


class PosConfig(models.Model):
    _inherit = "pos.config"

    # ir.actions.server methods:
    @api.model
    def notify_debt_updates(self):
        model = self.env.context["active_model"]
        ids = self.env.context["active_ids"]
        records = self.env[model].sudo().browse(ids)

        partners = None
        if model == "account.bank.statement.line":
            partners = records.mapped(lambda r: r.pos_statement_id.partner_id)
        elif model == "pos.order":
            partners = records.filtered(
                lambda r: r.state in ["paid", "done"]
                and any(line.product_id.credit_product for line in r.lines)
            ).mapped(lambda r: r.partner_id)
        elif model == "account.invoice":
            partners = records.filtered(
                lambda r: r.state in ["paid"]
                and any(line.product_id.credit_product for line in r.invoice_line_ids)
            ).mapped(lambda r: r.partner_id)
        elif model == "pos.credit.update":
            partners = records.mapped(lambda r: r.partner_id)

        if partners:
            message = {"updated_partners": partners.ids}
            self.search([])._send_to_channel(CHANNEL, message)
