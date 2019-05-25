# Copyright 2016-2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2016 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2017 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from datetime import datetime, timedelta
import errno
import glob
import json
import logging
import os
import requests
import select
import subprocess
import unittest2
import xmlrpclib

#
# Logger
#
_logger = logging.getLogger(__name__)
_logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s %(message)s")
handler.setFormatter(formatter)
_logger.addHandler(handler)

#
# Base configs
#

PORT = os.environ.get('ODOO_PORT') or '80'
DATABASE = os.environ.get('DATABASE')
ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "admin"
MAIN_DOMAIN = os.environ.get('ODOO_DOMAIN') or 'localhost'
MAIN_URL = 'http://%s:%s' % (MAIN_DOMAIN, PORT)


class ExternalTestCase(unittest2.TestCase):
    '''Runs external tests.

       It means that we use xmlrpc instead of usual registry and transactions are not rollbacked.
    '''

    @classmethod
    def setUpClass(cls):
        super(ExternalTestCase, cls).setUpClass()
        # Authenticate
        admin_uid = cls.login2uid(ADMIN_LOGIN, ADMIN_PASSWORD)
        models = xmlrpclib.ServerProxy('{}/xmlrpc/2/object'.format(MAIN_URL))
        assert admin_uid, 'Authentication failed %s' % ((DATABASE, ADMIN_LOGIN, ADMIN_PASSWORD),)

        cls.admin_uid = admin_uid
        cls.xmlrpc_models = models

    #
    # RPC tools
    #
    @classmethod
    def login2uid(cls, login, password):
        common = xmlrpclib.ServerProxy('{}/xmlrpc/2/common'.format(MAIN_URL))
        return common.authenticate(DATABASE, login, password, {})

    def execute_kw(self, model, method, rpc_args=None, rpc_kwargs=None, uid=None, password=None):
        rpc_args = rpc_args or []
        rpc_kwargs = rpc_kwargs or []
        uid = uid or self.admin_uid
        password = password or ADMIN_PASSWORD
        res = self.xmlrpc_models.execute_kw(
            DATABASE, uid, password,
            model, method, rpc_args, rpc_kwargs)
        _logger.info('RPC Execute: %s\n-> %s', [model, method, rpc_args, rpc_kwargs], res)

        return res

    def exec_workflow(self, model, signal, rid, uid=None, password=None):
        uid = uid or self.admin_uid
        password = password or ADMIN_PASSWORD
        return self.xmlrpc_models.exec_workflow(
            DATABASE, uid, password,
            model, signal, rid)

    def xmlid_to_id(self, xmlid, uid=None, password=None):
        res_id = self.execute_kw('ir.model.data', 'xmlid_to_res_id', [xmlid], uid=uid, password=password)
        return res_id

    #
    # phantomjs tools
    #
    def authenticate(self, login, password=None):
        if not password:
            password = login

        data = {"db": DATABASE, "login": login, "password": password}
        res = requests.post("http://%s:%s/web/session/authenticate" % (MAIN_DOMAIN, PORT),
                            data=json.dumps({'params': data}),
                            headers={"Content-Type": "application/json"})
        _logger.info('authenticate: %s', res.json())
        return res.json()['result']['session_id']

    def phantom_js_multi(self, sessions, commands, timeout=60, **kw):
        """check phantomtest.js for description of sessions and commands"""
        for sname, sdata in sessions.items():
            sid = self.authenticate(sdata['login'], sdata.get('password'))
            sdata.setdefault('session_id', sid)

        options = {
            # since 10.0 we use odoo with --workers=1 + nginx,
            # and hence we shall not specify port and proxy requests to nginx
            # 'port': PORT,
            'db': DATABASE,
            'sessions': sessions,
            'commands': commands,
            'host': MAIN_DOMAIN,
        }

        options.update(kw)
        phantomtest = os.path.join(os.path.dirname(__file__), 'phantomtest.js')
        cmd = ['phantomjs', phantomtest, json.dumps(options)]

        self.phantom_run(cmd, timeout)

    # Copy-paste from openerp/tests/common.py
    def phantom_run(self, cmd, timeout):
        _logger.info('phantom_run executing %s', ' '.join(cmd))

        ls_glob = os.path.expanduser('~/.qws/share/data/Ofi Labs/PhantomJS/http_localhost_%s.*' % PORT)
        for i in glob.glob(ls_glob):
            _logger.info('phantomjs unlink localstorage %s', i)
            os.unlink(i)
        try:
            phantom = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=None)
        except OSError:
            raise unittest2.SkipTest("PhantomJS not found")
        try:
            self.phantom_poll(phantom, timeout)
        finally:
            # kill phantomjs if phantom.exit() wasn't called in the test
            if phantom.poll() is None:
                phantom.terminate()
                phantom.wait()
            # self._wait_remaining_requests()
            # we ignore phantomjs return code as we kill it as soon as we have ok
            _logger.info("phantom_run execution finished")

    def phantom_poll(self, phantom, timeout):
        """ Phantomjs Test protocol.

        Use console.log in phantomjs to output test results:

        - for a success: console.log("ok")
        - for an error:  console.log("error")

        Other lines are relayed to the test log.

        """
        t0 = datetime.now()
        td = timedelta(seconds=timeout)
        buf = bytearray()
        pid = phantom.stdout.fileno()
        while True:
            # timeout
            self.assertLess(datetime.now() - t0, td, "PhantomJS tests should take less than %s seconds" % timeout)

            # read a byte
            try:
                ready, _, _ = select.select([pid], [], [], 0.5)
            except select.error as e:
                # In Python 2, select.error has no relation to IOError or
                # OSError, and no errno/strerror/filename, only a pair of
                # unnamed arguments (matching errno and strerror)
                err, _ = e.args
                if err == errno.EINTR:
                    continue
                raise

            if ready:
                s = phantom.stdout.read(1)
                if not s:
                    break
                buf.append(s)

            # process lines
            if '\n' in buf:
                line, buf = buf.split('\n', 1)
                line = str(line)

                # relay everything from console.log, even 'ok' or 'error...' lines
                _logger.info("phantomjs: %s", line)

                if line == "ok":
                    break
                if line.startswith("error"):
                    line_ = line[6:]
                    # when error occurs the execution stack may be sent as as JSON
                    try:
                        line_ = json.loads(line_)
                    except ValueError:
                        pass
                    self.fail(line_ or "phantomjs test failed")
