# -*- coding: utf-8 -*-
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import api, models, fields


class PosCreditUpdateReward(models.Model):

    _name = 'pos.credit.update.reward'
    _inherits = {'pos.credit.update': 'credit_update_id'}
    _inherit = 'barcodes.barcode_events_mixin'
    _description = "Manual Credit Updates"

    credit_update_id = fields.Many2one(
        'pos.credit.update',
        string='Credit Update model',
        ondelete="cascade",
        required=True)
    attendance_ids = fields.Many2many(
        'res.partner.attendance', 'attendance_ids_rewards_ids_rel', 'attendance_id', 'reward_id',
        string="Attendances",
        required=True)
    reward_type_id = fields.Many2one(
        'pos.credit.update.reward.type',
        string='Reward type',
        required=True)

    def on_barcode_scanned(self, barcode):
        partner = self.env['res.partner'].search([('barcode', '=', barcode)])
        if partner:
            self.partner_id = partner[0]

    @api.onchange('partner_id')
    def _onchange_partner(self):
        attendances = self.env['res.partner.attendance'].search([('partner_id', '=', self.partner_id.id),
                                                                 ('reward_ids', '=', False)])
        self.attendance_ids = attendances

    @api.onchange('reward_type_id')
    def _onchange_reward_type(self):
        self.journal_id = self.reward_type_id.journal_id.id
        self.note = self.reward_type_id.name

    @api.model
    def create(self, vals):
        vals = self.update_vals_with_journal(vals)
        return super(PosCreditUpdateReward, self).create(vals)

    @api.multi
    def write(self, vals):
        vals = self.update_vals_with_journal(vals)
        return super(PosCreditUpdateReward, self).write(vals)

    def switch_to_confirm(self):
        self.credit_update_id.balance = self.reward_type_id.amount
        return self.credit_update_id.switch_to_confirm()

    def switch_to_cancel(self):
        return self.credit_update_id.switch_to_cancel()

    def switch_to_draft(self):
        return self.credit_update_id.switch_to_draft()

    def update_vals_with_journal(self, vals):
        if 'reward_type_id' in vals:
            reward_type_id = vals['reward_type_id']
            vals['journal_id'] = self.env['pos.credit.update.reward.type'] \
                .search([('id', '=', reward_type_id)]).journal_id.id
        return vals

    def do_confirm(self):
        self.credit_update_id.do_confirm()


class RewardType(models.Model):
    _name = 'pos.credit.update.reward.type'

    name = fields.Char('Name', required=True)
    journal_id = fields.Many2one('account.journal', string='Journal', required=True,
                                 help='journal to convert hours to credits in it',
                                 domain="[('debt', '=', True)]")
    amount = fields.Float('Reward amount', help='A coefficient to transfer shifts to credits', default=0)


class PartnerAttendance(models.Model):
    _inherit = 'res.partner.attendance'

    reward_ids = fields.Many2many(
        'pos.credit.update.reward', 'attendance_ids_rewards_ids_rel', 'reward_id', 'attendance_id',
        string='Reward id')
