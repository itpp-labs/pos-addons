# -*- coding: utf-8 -*-
from .common import TestCommon


class TestSync(TestCommon):

    def _test_10_new_order(self):
        """Simplest case. Sync new order"""
        self.phantom_js_multi({
            # use default settings for sessions (see ./common.py)
            "admin": {},
            "demo": {}
        }, [
            # admin fills order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 share.order = mstest.save_order();
             """,
             },
            # demo syncs order
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                     mstest.find_order(share.order);
                 })
             """,
             },
            # TODO: admin close order (make a payment)
            # TODO: demo syncs order
            # ok
            {"session": "demo",
             "code": "console.log('ok');",
             },
        ], 120)

    def test_20_offline(self):
        """One POS is offline some time"""
        self.phantom_js_multi({
            # use default settings for sessions (see ./common.py)
            "admin": {},
            "demo": {}
        }, [
            # admin orders remove
            {"session": "admin",
             "code": """
                 mstest.remove_all_orders();
             """,
             },
            # demo orders remove
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                    mstest.remove_all_orders();
                 })
             """,
             },
            # admin creates order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 share.order = mstest.save_order();
             """,
             },
            # demo syncs order
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                     mstest.find_order(share.order);
                 })
             """,
             },
            # demo is off
            {"session": "demo",
             "extra": "connection_off",
             },
            # admin updates order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                    mstest.fill_order();
                 }, 3000)
                 share.order = mstest.save_order();
             """,
             },
            # GC
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                     mstest.gc();
                 }, 2000);
             """,
             },
            # demo creates new order
            {"session": "demo",
             "code": """
                mstest.new_order();
             """,
             },
            # demo is on
            {"session": "demo",
             "extra": "connection_on",
             },

            # admin updates order
            {"session": "admin",
             "code": """
                mstest.wait(function(){
                    mstest.fill_order();
                    share.order = mstest.save_order();
                 }, 6000)
             """,
             },
            # check sync on demo
            {"session": "demo",
             "code": """
                mstest.find_order(share.order);
             """,
             },
            # ok
            {"session": "demo",
             "code": "console.log('ok');",
             },
        ], 120)


