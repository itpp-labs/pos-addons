# -*- coding: utf-8 -*-

import logging
import odoo
from odoo.http import request

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

        ms = request.env["pos_multi_session_sync.multi_session"].sudo()\
                    .search([('multi_session_ID', '=', int(multi_session_id)),
                             ('dbname', '=', dbname)])
        if not ms:
            ms = request.env["pos_multi_session_sync.multi_session"].sudo() \
                        .create({'multi_session_ID': int(multi_session_id), 'dbname': dbname})
        res = ms.with_context(user_ID=user_ID, phantomtest=phantomtest).sudo().on_update_message(message)
        return res
