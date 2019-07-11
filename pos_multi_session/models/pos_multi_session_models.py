# Copyright 2015-2016 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2016 Ilyas Rakhimkulov
# Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2016-2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import logging
from odoo import api
from odoo import fields
from odoo import models

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    multi_session_id = fields.Many2one('pos.multi_session', 'Multi-session',
                                       help='Set the same value for POSes where orders should be synced.'
                                            'Uncheck the box "Active" if the POS should not use syncing.'
                                            'Before updating you need to close active session')
    multi_session_accept_incoming_orders = fields.Boolean('Accept incoming orders', default=True)
    multi_session_replace_empty_order = fields.Boolean('Replace empty order', default=True, help='Empty order is deleted whenever new order is come from another POS')
    multi_session_deactivate_empty_order = fields.Boolean('Deactivate empty order', default=False, help='POS is switched to new foreign Order, if current order is empty')
    current_session_state = fields.Char(search='_search_current_session_state')
    sync_server = fields.Char(related='multi_session_id.sync_server')
    autostart_longpolling = fields.Boolean(default=False)
    fiscal_position_ids = fields.Many2many(related='multi_session_id.fiscal_position_ids')
    company_id = fields.Many2one(related='multi_session_id.company_id', store=True, default=lambda self: self.env.user.company_id)
    # stock_location_id = fields.Many2one(related='multi_session_id.stock_location_id', store=True)

    def _search_current_session_state(self, operator, value):
        ids = map(lambda x: x.id, self.env["pos.config"].search([]))
        value_ids = map(lambda x: x.config_id.id, self.env["pos.session"].search([('state', '=', value)]))
        value_ids = list(set(value_ids))
        if operator == '=':
            return [('id', 'in', value_ids)]
        elif operator == '!=':
            ids = [item for item in ids if item not in value_ids]
            return [('id', 'in', ids)]
        else:
            return [('id', 'in', [])]

    @api.multi
    def _write(self, vals):
        # made to prevent 'expected singleton' errors in *pos.config* constraints
        result = False
        for config in self:
            result = super(PosConfig, config)._write(vals)
        return result


class PosMultiSession(models.Model):
    _name = 'pos.multi_session'

    def _get_default_location(self):
        return self.env['stock.warehouse'].search([('company_id', '=', self.env.user.company_id.id)], limit=1).lot_stock_id

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
    company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.user.company_id)

    @api.model
    def action_set_default_multi_session(self):
        """
            during installation of the module set default multi-sessions
            (separate default multi-session for each company)
            for all POSes with not set multi_session_id
        """
        companies = self.env['res.company'].search([])
        for company in companies:
            configs = self.env['pos.config'].search([('multi_session_id', '=', False), ('company_id', '=', company.id)])

            # If there are POSes with the company then we need to create default multi-session
            if configs:
                # Create default multi-session for current company
                multi_session = self.create({
                    'name': 'Default Multi Session (%s)' % company.name,
                    'multi_session_active': False,
                    'company_id': company.id,
                })
                # odoo.exceptions.ValidationError: ('Error while validating constraint\n\nExpected singleton: pos.config(1, 2, 3)', None)
                for c in configs:
                    c.write({
                        'multi_session_id': multi_session.id
                    })

    @api.multi
    def name_get(self):
        """ Override name_get method to return generated name."""
        res = super(PosMultiSession, self).name_get()
        res = [(record[0], record[1] + " - Syncronization is disabled" if self.browse(record[0]).multi_session_active is False else record[1]) for record in res]
        return res


class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.multi
    def action_pos_session_close(self):
        res = super(PosSession, self).action_pos_session_close()
        active_sessions = self.env['pos.session'].search([('state', '!=', 'closed'), ('config_id.multi_session_id', '=', self.config_id.multi_session_id.id)])
        if len(active_sessions) == 0:
            self.config_id.multi_session_id.sudo().write({'order_ID': 0})
            run_ID = self.config_id.multi_session_id.run_ID + 1
            self.config_id.multi_session_id.sudo().write({'run_ID': run_ID})
        return res
