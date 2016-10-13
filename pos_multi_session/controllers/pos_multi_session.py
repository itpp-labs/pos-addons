# -*- coding: utf-8 -*-
import datetime
import logging

import openerp
from openerp.http import request
from openerp.addons.bus.bus import Controller as bus_controller
from openerp.tools.misc import DEFAULT_SERVER_DATETIME_FORMAT

_logger = logging.getLogger(__name__)

class Controller(bus_controller):

    def _poll(self, dbname, channels, last, options):
        if request.session.uid:
            channels.append((request.db, 'pos.multi_session', request.uid))
        return super(Controller, self)._poll(dbname, channels, last, options)

    @openerp.http.route('/pos_multi_session/update', type="json", auth="public")
    def multi_session_update(self, multi_session_id, message):
        res = request.env["pos.multi_session"].browse(int(multi_session_id)).on_update_message(message)
        return res

    @openerp.http.route('/pos_multi_session/connection', type='http', auth="public")
    def connection(self, **kwargs):
        return "1"

    @openerp.http.route('/pos_multi_session/test/gc', type="json", auth="user")
    def pos_multi_session_test_gc(self):
        if not openerp.tools.config['test_enable']:
            _logger.warning('Run odoo with --test-enable to use test GC')
            return

        timeout_ago = datetime.datetime.utcnow()
        domain = [('create_date', '<=', timeout_ago.strftime(DEFAULT_SERVER_DATETIME_FORMAT))]
        res = request.env['bus.bus'].sudo().search(domain)
        for r in res:
            _logger.info('removed message: %s', r.message)
        ids = res.ids
        res.unlink()
        return ids
