# -*- coding: utf-8 -*-
from odoo import models, api


class PosConfig(models.Model):
    _inherit = 'pos.config'

    @api.multi
    def _check_same_floors(self):
        # Проверяем чтобы у всех ПОС у которых одинаковые мультисесии был одинаковый набор этажей (floors).
        # Ранее было решено добавить такое ограничение.
        # TODO
        # У тебя здесь N*(N-1) операций.
        # Можно проще делать:
        # Сделать search в pos.config с аттрибутом groupby='multi_session_id'
        # Потом в каждой группе взять один элемент и сравнить его с каждым. Если хоть одна разница есть, то return False.
        # Тогда будет N + N операций
        for rec in self:
            pos_configs = self.env['pos.config'].search([
                ('multi_session_id', '=', rec.multi_session_id.id),
                ('id', '!=', rec.id)
            ])
            for pos_config_obj in pos_configs:
                a = set(pos_config_obj.floor_ids.ids)
                b = set(rec.floor_ids.ids)
                diff = a.difference(b)
                if diff:
                    return False
        return True

    _constraints = [
        (_check_same_floors, "Points of sale with same multi session must have same floors", ['multi_session_id', 'floor_ids']),
    ]
