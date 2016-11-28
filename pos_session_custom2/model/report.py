# -*- coding: utf-8 -*-
from openerp import models


class Report(models.AbstractModel):
    _name = 'report.pos_session_custom2.report'

    def render_html(self, cr, uid, ids, data=None, context=None):
        report_obj = self.pool['report']
        Report = report_obj._get_report_from_name(
            cr, uid, 'pos_session_custom2.report'
        )
        docargs = {
            'doc_ids': ids,
            'doc_model': Report.model,
            'docs': self.pool[Report.model].browse(
                cr, uid, ids, context=context
            ),
        }
        return report_obj.render(
            cr, uid, ids, 'pos_session_custom2.report',
            docargs, context=context
        )
