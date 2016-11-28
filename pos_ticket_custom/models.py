# -*- coding: utf-8 -*-
from openerp import models, fields



class PosConfig(models.Model):
    _inherit = 'pos.config'


    pos_order_sequence_prefix = fields.Char('Pos order sequence prefix')
    pos_order_sequence_id = fields.Many2one('ir.sequence', 'Pos order sequence')


    def _update_pos_order_sequence_id(self, cr, uid, values):
        prefix = values.get('pos_order_sequence_prefix')

        if not prefix:
            return values

        seq_prefix = prefix + '-%(month)s%(y)s-'

        seq_id = values.get('pos_order_sequence_id')
        if not seq_id:
            seq_id = self.pool.get('ir.sequence').create(cr, uid, {
                'name': 'Pos order sequence',
                'padding': 5,
                'code': 'pos.order.custom',
                'prefix': seq_prefix,
                'auto_reset': True,
                'reset_period': 'month',
            })
            values.update({'pos_order_sequence_id': seq_id})
        else:
            self.pool.get('ir.sequence').write(cr, uid, [seq_id], {
                'prefix': seq_prefix
            })
        return values

    def create(self, cr, uid, values, context=None):
        self._update_pos_order_sequence_id(cr, uid, values)
        return super(PosConfig, self).create(cr, uid, values, context=context)

    def write(self, cr, uid, ids, vals, context=None):
        for conf in self.browse(cr, uid, ids, context):
            values = vals.copy()
            values.update({'pos_order_sequence_id': conf.pos_order_sequence_id.id})
            self._update_pos_order_sequence_id(cr, uid, values)
            super(PosConfig, self).write(cr, uid, [conf.id], values, context=context)
        return True


class PosOrder(models.Model):
    _inherit = 'pos.order'

    def create(self, cr, uid, values, context=None):
        res_id = super(PosOrder, self).create(cr, uid, values, context=context)
        order = self.browse(cr, uid, res_id, context)
        seq = order.session_id.config_id.pos_order_sequence_id
        if seq:
            name = self.pool.get('ir.sequence').next_by_id(cr, uid, seq.id, context)
        self.write(cr, uid, [res_id], {'name': name}, context)
        return res_id
