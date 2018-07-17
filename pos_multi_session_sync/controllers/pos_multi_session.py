# -*- coding: utf-8 -*-
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import datetime
import logging
import json
import odoo
from odoo.http import request
from odoo.tools.misc import DEFAULT_SERVER_DATETIME_FORMAT
_logger = logging.getLogger(__name__)


try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error('pos_multi_session_sync inconsisten with odoo version')
    BusController = object


class Controller(BusController):

    @odoo.http.route('/pos_multi_session_sync/update', type="json", auth="public")
    def multi_session_update(self, multi_session_id, message, dbname, user_ID):
        phantomtest = request.httprequest.headers.get('phantomtest')
        ms_model = request.env["pos_multi_session_sync.multi_session"]
        allow_public = request.env['ir.config_parameter'].get_param('pos_longpolling.allow_public')
        if allow_public:
            ms_model = ms_model.sudo()
        ms = ms_model.search([('multi_session_ID', '=', int(multi_session_id)),
                             ('dbname', '=', dbname)])
        if not ms:
            ms = ms_model.create({'multi_session_ID': int(multi_session_id), 'dbname': dbname})
        ms = ms.with_context(user_ID=user_ID, phantomtest=phantomtest)
        _logger.debug('On update message by user %s: %s', user_ID, message)
        res = ms.on_update_message(message)
        _logger.debug('Return result after update by user %s: %s', user_ID, res)
        return res

    @odoo.http.route('/pos_multi_session/test/gc', type="http", auth="user")
    def pos_multi_session_test_gc(self):
        allow_external_tests = request.env['ir.config_parameter'].get_param('pos_multi_session.allow_external_tests')
        if not allow_external_tests:
            _logger.warning('Create System Parameter "pos_multi_session.allow_external_tests" to use test GC')
            return 'Create System Parameter "pos_multi_session.allow_external_tests" to use test GC'

        timeout_ago = datetime.datetime.utcnow()
        domain = [('create_date', '<=', timeout_ago.strftime(DEFAULT_SERVER_DATETIME_FORMAT))]
        res = request.env['bus.bus'].sudo().search(domain)
        for r in res:
            _logger.info('removed message: %s', r.message)
        ids = res.ids
        res.unlink()
        ids = json.dumps(ids)
        return ids
