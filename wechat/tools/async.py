# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import threading


from odoo import api

__all__ = ['odoo_async_call']


def odoo_async_call(target, callback, args, kwargs):
    t = threading.Thread(target=odoo_wrapper, args=(target, callback, args, kwargs))
    t.start()
    return t


def odoo_wrapper(target, callback, args, kwargs):
    # db = odoo.sql_db.db_connect(dbname)
    self = target.im_self
    with api.Environment.manage(), self.pool.cursor() as cr:
        self = self.with_env(self.env(cr=cr))
        callback(target(self, *args, **kwargs))
