# -*- coding: utf-8 -*-

from odoo import api, models, fields, _


class PosCreditUpdateReward(models.Model):

    _name = 'pos.credit.update.reward'
    _inherits = {'pos.credit.update': 'credit_update_id'}
    _description = "Manual Credit Updates"

    credit_update_id = fields.Many2one(
        'pos.credit.update',
        string='Credit Update model id',
        ondelete="cascade",
        required=True)
    attendance_ids = fields.Many2many(
        'res.partner.attendance', 'attendance_ids_rewards_ids_rel', 'attendance_id', 'reward_id',
        string="Attendances ids",
        required=True)
    arel_ids = fields.Many2many(
        comodel_name='res.users',
        relation='table_name',
        column1='col_name',
        column2='other_col_name')
    reward_type_id = fields.Many2one(
        'pos.credit.update.reward.type',
        string='Reward type',
        required=True)
    note = fields.Text(default='Reward for an attendance')

    @api.onchange('partner_id')
    def _onchange_partner(self):
        attendances = self.env['res.partner.attendance'].search([('partner_id', '=', self.partner_id.id),
                                                                 ('reward_ids', '=', False)])

        self.attendance_ids = attendances

    @api.onchange('reward_type_id')
    def _onchange_reward_type(self):
        self.journal_id = self.reward_type_id.journal_id.id

    @api.model
    def create(self, vals):
        reward_type_id = vals['reward_type_id']
        vals['journal_id'] = self.env['pos.credit.update.reward.type']\
            .search([('id', '=', reward_type_id)]).journal_id.id
        return super(PosCreditUpdateReward, self).create(vals)

    @api.multi
    def write(self, vals):
        reward_type_id = vals['reward_type_id']
        vals['journal_id'] = self.env['pos.credit.update.reward.type'] \
            .search([('id', '=', reward_type_id)]).journal_id.id
        return super(PosCreditUpdateReward, self).write(vals)

    def switch_to_confirm(self):
        self.credit_update_id.balance = self.reward_type_id.amount
        return self.credit_update_id.switch_to_confirm()

    def switch_to_cancel(self):
        return self.credit_update_id.switch_to_cancel()

    def switch_to_draft(self):
        return self.credit_update_id.switch_to_draft()


class RewardType(models.Model):
    _name = 'pos.credit.update.reward.type'

    name = fields.Char('Name')
    journal_id = fields.Many2one('account.journal', string='Journal', help='journal to convert hours to credits in it')
    amount = fields.Float('Reward amount', help='A coefficient to transfer shifts to credits', default=0)


class PartnerAttendance(models.Model):
    _inherit = 'res.partner.attendance'

    reward_ids = fields.Many2many(
        'pos.credit.update.reward', 'attendance_ids_rewards_ids_rel', 'reward_id', 'attendance_id',
        string='Reward id')
