# Copyright 2015-2016 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2016 Ilyas Rakhimkulov
# Copyright 2017 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2016-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).

import logging
from odoo import api, models, fields, _
from odoo.exceptions import UserError
import datetime
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT


_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = "pos.config"

    multi_session_id = fields.Many2one(
        "pos.multi_session",
        "Multi-session",
        help="Set the same value for POSes where orders should be synced."
        'Uncheck the box "Active" if the POS should not use syncing.'
        "Before updating you need to close active session",
        default=lambda self: self.env.ref(
            "pos_multi_session.default_multi_session", raise_if_not_found=False
        ),
    )
    multi_session_accept_incoming_orders = fields.Boolean(
        "Accept incoming orders", default=True
    )
    multi_session_replace_empty_order = fields.Boolean(
        "Replace empty order",
        default=True,
        help="Empty order is deleted whenever new order is come from another POS",
    )
    multi_session_deactivate_empty_order = fields.Boolean(
        "Deactivate empty order",
        default=False,
        help="POS is switched to new foreign Order, if current order is empty",
    )
    current_session_state = fields.Char(search="_search_current_session_state")
    sync_server = fields.Char(related="multi_session_id.sync_server")
    autostart_longpolling = fields.Boolean(default=False)
    fiscal_position_ids = fields.Many2many(
        related="multi_session_id.fiscal_position_ids"
    )
    company_id = fields.Many2one(related="multi_session_id.company_id")

    def _search_current_session_state(self, operator, value):
        ids = map(lambda x: x.id, self.env["pos.config"].search([]))
        value_ids = map(
            lambda x: x.config_id.id,
            self.env["pos.session"].search([("state", "=", value)]),
        )
        value_ids = list(set(value_ids))
        if operator == "=":
            return [("id", "in", value_ids)]
        elif operator == "!=":
            ids = [item for item in ids if item not in value_ids]
            return [("id", "in", ids)]
        else:
            return [("id", "in", [])]

    @api.multi
    def open_ui(self):
        res = super(PosConfig, self).open_ui()
        active_sessions = self.env['pos.session'].search(
            [('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.multi_session_id.id)])
        if len(active_sessions) == 1 and active_sessions.id == self.current_session_id.id and self.multi_session_id.load_unpaid_orders:
            orders = self.multi_session_id.get_unpaid_ms_orders()
            if orders:
                orders.write({
                    'state': 'draft',
                    'run_ID': self.multi_session_id.run_ID
                })
        return res


class PosMultiSession(models.Model):
    _name = "pos.multi_session"

    name = fields.Char('Name')
    multi_session_active = fields.Boolean(string="Active", help="Select the checkbox to enable synchronization for POSes", default=True)
    pos_ids = fields.One2many('pos.config', 'multi_session_id', string='POSes in Multi-session')
    order_ID = fields.Integer(string="Order number", default=0, help="Current Order Number shared across all POS in Multi Session")
    sync_server = fields.Char('Sync Server', default='')
    run_ID = fields.Integer(string="Running count", default=1,
                            help="Number of Multi-session starts. "
                                 "It's incremented each time the last session in Multi-session is closed. "
                                 "It's used to prevent synchronization of old orders")
    fiscal_position_ids = fields.Many2many('account.fiscal.position', string='Fiscal Positions', ondelete="restrict")
    load_unpaid_orders = fields.Boolean(string="Load Unpaid Orders", default=False,
                                        help="Allows you to load unpaid orders to POS."
                                             "Please close all POS sessions before loading unpaid orders.")
    load_orders_of_last_n_days = fields.Boolean("Unpaid Orders of last 'n' days", default=False,
                                                help="if the setting is disabled then all orders will be loaded to POS")
    number_of_days = fields.Integer("Number of days", default=0, help='0 - load orders of current day')
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        required=True,
        default=lambda self: self.env.user.company_id,
    )

    @api.constrains('load_unpaid_orders')
    def _check_load_unpaid_orders(self):
        if self.load_unpaid_orders:
            active_sessions = self.env['pos.session'].search(
                [('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.id)])
            if active_sessions:
                raise UserError(_("Please close all POSes for this multi-session for load unpaid Orders."))

    @api.constrains('number_of_days')
    def _check_number_of_days(self):
        if self.load_unpaid_orders and self.load_orders_of_last_n_days and self.number_of_days < 0:
            raise UserError(_('The number of days should not be negative.'))

    @api.multi
    def get_unpaid_ms_orders(self):
        self.ensure_one()
        pos_multi_session_sync = self.env['pos_multi_session_sync.multi_session'].search([('multi_session_ID', '=', self.id)])
        if self.load_orders_of_last_n_days:
            limit_date = datetime.datetime.utcnow() - datetime.timedelta(days=self.number_of_days)
            limit_date_str = datetime.datetime.strftime(limit_date, DEFAULT_SERVER_DATE_FORMAT + ' 00:00:00')
            return self.env['pos_multi_session_sync.order'].search([('multi_session_ID', 'in', pos_multi_session_sync.ids),
                                                                    ('state', '=', 'unpaid'),
                                                                    ('write_date', '>=', limit_date_str)])

        return self.env['pos_multi_session_sync.order'].search([('multi_session_ID', 'in', pos_multi_session_sync.ids),
                                                                ('state', '=', 'unpaid')])

    @api.multi
    def action_set_default_multi_session(self):
        """
            during installation of the module set default multi-session
            for all POSes for which multi_session_id is not specified
        """
        self.ensure_one()
        configs = self.env["pos.config"].search([("multi_session_id", "=", False)])
        configs.write({"multi_session_id": self.id})

    @api.multi
    def name_get(self):
        """ Override name_get method to return generated name."""
        res = super(PosMultiSession, self).name_get()
        res = [
            (
                record[0],
                record[1] + " - Syncronization is disabled"
                if self.browse(record[0]).multi_session_active is False
                else record[1],
            )
            for record in res
        ]
        return res


class PosSession(models.Model):
    _inherit = "pos.session"

    @api.multi
    def action_pos_session_close(self):
        res = super(PosSession, self).action_pos_session_close()
        active_sessions = self.env["pos.session"].search(
            [
                ("state", "!=", "closed"),
                ("config_id.multi_session_id", "=", self.config_id.multi_session_id.id),
            ]
        )
        if len(active_sessions) == 0:
            self.config_id.multi_session_id.sudo().write({"order_ID": 0})
            run_ID = self.config_id.multi_session_id.run_ID + 1
            self.config_id.multi_session_id.sudo().write({'run_ID': run_ID})
            pos_multi_session_sync = self.env['pos_multi_session_sync.multi_session'].search(
                [('multi_session_ID', '=', self.config_id.multi_session_id.id)])
            orders = self.env['pos_multi_session_sync.order'].search([('multi_session_ID', 'in', pos_multi_session_sync.ids),
                                                                      ('state', '=', 'draft')])
            orders.write({'state': 'unpaid'})
        return res
