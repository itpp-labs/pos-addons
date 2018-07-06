# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import threading


from odoo import api, tools

__all__ = ['odoo_async_call']


def odoo_async_call(target, callback, args, kwargs):
    t = threading.Thread(target=odoo_wrapper, args=(target, callback, args, kwargs))
    t.start()
    return t


def odoo_wrapper(target, callback, args, kwargs):
    # db = odoo.sql_db.db_connect(dbname)
    try:
        # python 3
        self = target.__self__
    except:
        # python 2
        self = target.im_self

    target_name = target.__name__
    with api.Environment.manage(), self.pool.cursor() as cr:
        if not tools.config['test_enable']:
            cr = self.registry.test_cr
        self = self.with_env(self.env(cr=cr))
        callback(getattr(self, target_name)(*args, **kwargs))
