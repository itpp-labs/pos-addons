# -*- coding: utf-8 -*-

from odoo import api, models, fields, _


class PosCreditUpdateRewards(models.Model):

    _name = 'pos.credit.update.rewards'
    _inherits = {'pos.credit.update': 'credit_update_id'}
    _description = "Manual Credit Updates"

    credit_update_id = fields.Many2one(
        'pos.credit.update',
        string='Credit Update model id',
        ondelete="cascade",
        required=True)
    attendance_ids = fields.One2many(
        comodel_name='res.partner.attendance',
        inverse_name='reward_id',
        string="Attendances ids")
    reward_type = fields.Many2one(
        'pos.debt.reward',
        string='Reward type',
        required=True)

    @api.onchange('partner_id')
    def _onchange_partner(self):
        attendances = self.env['res.partner.attendance'].search([('partner_id', '=', self.partner_id.id),
                                                                 ('reward_id', 'in', [0, None, False])])
        self.attendance_ids = [(6, 0, attendances.ids)]

    def switch_to_confirm(self):
        attendances = self.env['res.partner.attendance'].search([('partner_id', '=', self.partner_id.id),
                                                                 ('reward_id', 'in', [0, None, False])])
        self.attendance_ids = [(6, 0, attendances.ids)]
        self.credit_update_id.balance = len(self.attendance_ids) * self.reward_type.amount
        return self.credit_update_id.switch_to_confirm()

    def switch_to_cancel(self):
        return self.credit_update_id.switch_to_cancel()

    def switch_to_draft(self):
        return self.credit_update_id.switch_to_draft()


class RewardType(models.Model):
    _name = 'pos.debt.reward'

    name = fields.Char('Name')
    journal_id = fields.Many2one('account.journal', string='journal to convert hours to credits in it')
    amount = fields.Float('Reward amount', help='A coefficient to transfer shifts to credits', default=0)


class PartnerAttendance(models.Model):
    _inherit = 'res.partner.attendance'

    reward_id = fields.Many2one('pos.credit.update.rewards', string='Reward id')
