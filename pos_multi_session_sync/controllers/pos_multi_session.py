# -*- coding: utf-8 -*-
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

import copy
import datetime
import json
import logging

import odoo
from odoo.http import request
from odoo.tools.misc import DEFAULT_SERVER_DATETIME_FORMAT

_logger = logging.getLogger(__name__)


try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error("pos_multi_session_sync inconsisten with odoo version")
    BusController = object


class Controller(BusController):
    @odoo.http.route("/pos_multi_session_sync/update", type="json", auth="public")
    def multi_session_update(self, multi_session_id, message, dbname, user_ID):
        # Don't change original dict, because in case of SERIALIZATION_FAILURE
        # the method will be called with the same dictionary
        message = copy.deepcopy(message)
        phantomtest = request.httprequest.headers.get("phantomtest")
        ms_model = request.env["pos_multi_session_sync.multi_session"]
        allow_public = request.env["ir.config_parameter"].get_param(
            "pos_longpolling.allow_public"
        )
        if allow_public:
            ms_model = ms_model.sudo()
        multi_session = ms_model.search(
            [("multi_session_ID", "=", int(multi_session_id)), ("dbname", "=", dbname)]
        )
        if len(multi_session) > 1:
            # somehow this case happened, but there is no scenario to reproduce
            # TODO: determine the scenario and fix
            multi_session.unlink()
        if not multi_session:
            multi_session = ms_model.create(
                {"multi_session_ID": int(multi_session_id), "dbname": dbname}
            )

        multi_session = multi_session.with_context(
            user_ID=user_ID, phantomtest=phantomtest
        )
        _logger.debug(
            "On update message by user %s (dbname=%s, multi_session_id=%s): %s",
            user_ID,
            dbname,
            multi_session_id,
            message,
        )
        res = multi_session.on_update_message(message)
        _logger.debug("Return result after update by user %s: %s", user_ID, res)
        return res

    @odoo.http.route("/pos_multi_session/test/gc", type="http", auth="user")
    def pos_multi_session_test_gc(self):
        allow_external_tests = request.env["ir.config_parameter"].get_param(
            "pos_multi_session.allow_external_tests"
        )
        if not allow_external_tests:
            _logger.warning(
                'Create System Parameter "pos_multi_session.allow_external_tests" to use test GC'
            )
            return 'Create System Parameter "pos_multi_session.allow_external_tests" to use test GC'

        timeout_ago = datetime.datetime.utcnow()
        domain = [
            ("create_date", "<=", timeout_ago.strftime(DEFAULT_SERVER_DATETIME_FORMAT))
        ]
        res = request.env["bus.bus"].sudo().search(domain)
        for r in res:
            _logger.info("removed message: %s", r.message)
        ids = res.ids
        res.unlink()
        ids = json.dumps(ids)
        return ids
