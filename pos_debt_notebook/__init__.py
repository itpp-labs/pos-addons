# License MIT (https://opensource.org/licenses/MIT).
from . import models
from . import report
from . import wizard

from odoo import SUPERUSER_ID
from odoo import api
from odoo.tools.translate import _
from odoo.exceptions import UserError


def pre_uninstall(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    if env["pos.session"].search([("state", "=", "opened")]):
        raise UserError(
            _("You have open session of Point of Sale. Please close them first.")
        )

    debt_journals = env["account.journal"].search([("debt", "=", True)])
    value = []
    for journal in debt_journals:
        value.append((3, journal.id))

    for config in env["pos.config"].search([]):
        config.write({"payment_method_ids": value})
