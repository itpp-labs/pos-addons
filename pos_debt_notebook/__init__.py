import models

from openerp import SUPERUSER_ID


def init_debt_journal(cr, registry):
    if registry['ir.model.data'].search(cr, SUPERUSER_ID, [('name', '=', 'debt_account')]):
        # Used account journal from old version module, don't supported multi-company mode
        return

    company_ids = registry['res.company'].search(cr, SUPERUSER_ID, [])
    for company in registry['res.company'].browse(cr, SUPERUSER_ID, company_ids):
        if len(registry['account.account'].search(cr, SUPERUSER_ID, [('company_id', '=', company.id)])) == 0:
            # You have to configure chart of account for company
            continue

        debt_journal_active = registry['account.journal'].search(cr, SUPERUSER_ID, [
            ('company_id', '=', company.id), ('debt', '=', True)])
        if debt_journal_active:
            continue
        else:
            debt_account = registry['account.account'].search(cr, SUPERUSER_ID, [
                ('name', '=', 'Debt'), ('code', '=', 'XDEBT'), ('company_id', '=', company.id)])
            if debt_account:
                debt_account = debt_account[0]
            else:
                debt_account = registry['account.account'].create(cr, SUPERUSER_ID, {
                    'name': 'Debt',
                    'code': 'XDEBT',
                    'type': 'liquidity',
                    'user_type': registry.get('ir.model.data').get_object_reference(cr, SUPERUSER_ID, 'account', 'data_account_type_asset')[1],
                    'company_id': company.id
                })
                registry['ir.model.data'].create(cr, SUPERUSER_ID, {
                    'name': 'debt_account_' + company.id,
                    'model': 'account.account',
                    'module': 'pos_debt_notebook',
                    'res_id': debt_account,
                    'noupdate': True,
                })

            debt_journal_inactive = registry['account.journal'].search(cr, SUPERUSER_ID, [
                ('company_id', '=', company.id), ('debt', '=', False), ('code', '=', 'TDEBT')])
            if debt_journal_inactive:
                new_journal = registry['account.journal'].browse(cr, SUPERUSER_ID, debt_journal_inactive[0])
                new_journal.write({
                    'debt': True,
                    'sequence_id': registry.get('ir.model.data').get_object_reference(cr, SUPERUSER_ID, 'pos_debt_notebook', 'sequence_debt_journal')[1],
                    'default_debit_account_id': debt_account,
                    'default_credit_account_id': debt_account,
                })
                new_journal = new_journal.id
            else:
                new_journal = registry['account.journal'].create(cr, SUPERUSER_ID, {
                    'name': 'Debt Journal',
                    'code': 'TDEBT',
                    'type': 'cash',
                    'debt': True,
                    'journal_user': True,
                    'sequence_id': registry.get('ir.model.data').get_object_reference(cr, SUPERUSER_ID, 'pos_debt_notebook', 'sequence_debt_journal')[1],
                    'company_id': company.id,
                    'default_debit_account_id': debt_account,
                    'default_credit_account_id': debt_account,
                })
                registry['ir.model.data'].create(cr, SUPERUSER_ID, {
                    'name': 'debt_journal_' + str(new_journal),
                    'model': 'account.journal',
                    'module': 'pos_debt_notebook',
                    'res_id': int(new_journal),
                    'noupdate': True,
                })

                config_ids = registry['pos.config'].search(cr, SUPERUSER_ID, [('company_id', '=', company.id)])
                for config in registry['pos.config'].browse(cr, SUPERUSER_ID, config_ids):
                    config.write({
                        'journal_ids': [(4, new_journal)],
                        'debt_dummy_product_id': registry.get('ir.model.data').get_object_reference(cr, SUPERUSER_ID, 'pos_debt_notebook', 'product_pay_debt')[1],
                    })
