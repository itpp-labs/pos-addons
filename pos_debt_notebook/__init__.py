# -*- coding: utf-8 -*-
from . import models
from . import report

from openerp import SUPERUSER_ID
from openerp.exceptions import Warning as UserError
from openerp.tools.translate import _


def pre_uninstall(cr, registry):
    if registry['pos.session'].search(cr, SUPERUSER_ID, [('state', '=', 'opened')]):
        raise UserError(_('You have open session of Point of Sale. Please close them first.'))

    config_ids = registry['pos.config'].search(cr, SUPERUSER_ID, [])
    debt_journals = registry['account.journal'].search(cr, SUPERUSER_ID, [('debt', '=', True)])
    for journal in registry['account.journal'].browse(cr, SUPERUSER_ID, debt_journals):
        for config in registry['pos.config'].browse(cr, SUPERUSER_ID, config_ids):
            config.write({
                'journal_ids': [(3, journal.id)]
            })
