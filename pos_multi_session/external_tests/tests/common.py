# -*- coding: utf-8 -*-
import os

from ..common import ExternalTestCase


class TestCommon(ExternalTestCase):

    def phantom_js_multi(self, sessions, commands, timeout=60, **kw):
        for sname, sdata in sessions.items():
            sdata.setdefault('url_path', "/pos/web?debug")
            sdata.setdefault('ready', "$('.loader:hidden').length")
            sdata.setdefault('timeout', 60)
            sdata.setdefault('login', sname)
            sdata.setdefault('inject', [['testInject', os.path.join(os.path.dirname(__file__), 'inject.js')]])

        for com in commands:
            com.setdefault('ready', '!mstest.is_wait')

        return super(TestCommon, self).phantom_js_multi(sessions, commands, timeout, **kw)

    def setUp(self):
        super(TestCommon, self).setUp()
        self.new_pos_session('admin', 'point_of_sale.pos_config_main')
        self.new_pos_session('demo', 'pos_multi_session.demo_multi_pos_config_one')
        self.new_pos_session('demo2', 'pos_multi_session.demo_multi_pos_config_two')

    def new_pos_session(self, login, config_xmlid):
        password = login
        uid = self.login2uid(login, password)

        # close old session if any
        self.close_pos_session(uid, password)

        # new session
        config_id = self.xmlid_to_id(config_xmlid, uid=uid, password=password)
        self.execute_kw('pos.session', 'create', [{
            'user_id': uid,
            'config_id': config_id,
        }], uid=uid, password=password)

    def close_pos_session(self, uid, password):

        ids = self.execute_kw('pos.session', 'search', [[('state', '<>', 'closed'), ('user_id', '=', uid)]], uid=uid, password=password)
        if ids:
            self.exec_workflow('pos.session', 'close', ids[0], uid=uid, password=password)
