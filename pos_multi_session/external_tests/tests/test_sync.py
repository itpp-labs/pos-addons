# -*- coding: utf-8 -*-
from .common import TestCommon


class TestSync(TestCommon):

    def test_10_new_order(self):
        """Simplest case. Sync new order"""
        self.phantom_js_multi({
            # use default settings for sessions (see ./common.py)
            "admin": {},
            "demo": {}
        }, [
            # initialisation
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
             "timeout": 35000,
             },
            # admin removes orders
            {"session": "admin",
             "code": """
                 console.log('test_10_new_order');
                 mstest.remove_all_orders();
            """,
             },
            # demo removes orders
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                     mstest.remove_all_orders();
                 })
            """,
             },
            # admin fills order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                 }, 3000)
             """,
             },

            # admin gets order
            {"session": "admin",
             "code": """
                  share.order = mstest.get_order();
              """,
             },
            # extra time for demo
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                 }, 5000)
            """,
             },
            # demo syncs order
            {"session": "demo",
             "code": """
                mstest.find_order(share.order);
             """,
             },
            # TODO: admin close order (make a payment)
            # TODO: demo syncs order
            # ok
            {"session": "demo",
             "code": "console.log('ok');",
             },
        ], 120)

    def test_20_offline_update_order(self):
        """One POS is offline, while another update order"""
        self.phantom_js_multi({
            # use default settings for sessions (see ./common.py)
            "admin": {},
            "demo": {}
        }, [
            # initialisation
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
             "timeout": 35000,
             },
            # admin removes orders
            {"session": "admin",
             "code": """
                 console.log('test_20_offline');
                 mstest.remove_all_orders();
             """,
             },
            # demo removes orders
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                    mstest.remove_all_orders();
                 })
             """,
             },
            # admin fills order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                 }, 5000)
             """,
             },

            # admin gets order
            {"session": "admin",
             "code": """
                  share.order = mstest.get_order();
              """,
             },
            # demo syncs order
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                     mstest.find_order(share.order);
                 }, 5000)
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
                    mstest.print_order();
                 }, 3000)
             """,
             },
            # GC
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                     mstest.gc();
                 }, 20000);
             """,
             "timeout": 25000,
             },
            # demo creates new order
            {"session": "demo",
             "code": """
                mstest.new_order();
                mstest.fill_order();
                mstest.wait(function(){
                    mstest.close_popup();
                    mstest.fill_order();
                }, 15000);
             """,
             "timeout": 20000,
             },
            # demo is on
            {"session": "demo",
             "extra": "connection_on",
             },
            # admin updates order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 share.order = mstest.get_order();
             """,
             },
            # check sync on demo
            {"session": "demo",
             "code": """
             mstest.wait(function(){
                mstest.find_order(share.order);
            }, 20000)
             """,
             "timeout": 25000,
             },
            # ok
            {"session": "demo",
             "code": "console.log('ok');",
             },
        ], 240)

    def test_21_offline_remove_order(self):
        """One POS is offline, while another remove order"""
        self.phantom_js_multi({
            # use default settings for sessions (see ./common.py)
            "admin": {},
            "demo": {}
        }, [
            # initialisation
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
             "timeout": 35000,
             },
            # admin removes orders
            {"session": "admin",
             "code": """
                 console.log('test_20_offline');
                 mstest.remove_all_orders();
             """,
             },
            # demo removes orders
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                    mstest.remove_all_orders();
                 })
             """,
             },
            # admin fills order
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                 })
             """,
             },
            # admin gets order
            {"session": "admin",
             "code": """
                  share.order = mstest.get_order();
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
            # admin removes order
            #
            # we fill order before removing,
            # because framework doesn't switch connnection off immediately
            # and we need to send some data to the last working polling
            {"session": "admin",
             "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                    mstest.remove_current_order()
                 }, 3000)
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
            # demo creates new order (to start reconnection process)
            {"session": "demo",
             "code": """
                mstest.new_order();
                mstest.fill_order();
                mstest.wait(function(){
                    mstest.fill_order();
                }, 6000);
             """,
             },
            # demo is on
            {"session": "demo",
             "extra": "connection_on",
             },
            # admin updates another order
            # (probably this is not necessary step)
            {"session": "admin",
             "code": """
                 mstest.fill_order();
             """,
             },
            # check sync on demo
            {"session": "demo",
             "code": """
             mstest.wait(function(){
                 if (mstest.order_exists(share.order)){
                     console.log('error', 'removed order still exists', share.order.order_num)
                 }
            }, 15000)
             """,
             "timeout": 25000,
             },
            # ok
            {"session": "demo",
             "code": "console.log('ok');",
             },
        ], 120)

    def test_30_slow(self):
        """Two POSes update the same order simultinously"""
        self.phantom_js_multi({
            # use default settings for sessions (see ./common.py)
            "admin": {},
            "demo": {}
        }, [
            # initialisation
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
             "timeout": 35000,
             },
            # admin removes orders
            {"session": "admin",
             "code": """
                 console.log('test_30_slow');
                 mstest.remove_all_orders();
             """,
             },
            # demo removes orders
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
                 mstest.print_order();
                 mstest.wait(function(){
                 })
             """,
             },

            # admin gets order
            {"session": "admin",
             "code": """
                 share.admin_order = mstest.get_order();
             """,
             },
            # demo switches to order
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                     mstest.find_order(share.admin_order);
                 }, 3000)
             """,
             },

            # demo's connection is slow down
            #
            # (we apply it for admin to delay his broadcast to other users,
            # i.e. demo will receive polling messages with 3 sec delay)
            {"session": "admin",
             "extra": "connection_slow",
             "code": """
                 console.log("demo's connection is slow down")
             """,
             },
            # admin waits and updates order
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                     console.log('Admin updates Order')
                     mstest.fill_order();
                 }, 5000)
             """,
             },
            # admin saves order
            {"session": "admin",
             "code": """
                 share.admin_order = mstest.get_order();
                 mstest.print_order();
             """,
             },
            # demo updates order immediately
            {"session": "demo",
             "code": """
                 console.log('Demo updates Order')
                 mstest.fill_order();
                 share.demo_order = mstest.get_order();
             """,
             },
            # admin waits compares order with his initial order
            {"session": "admin",
             "code": """
                 mstest.wait(function(){
                     mstest.print_order();
                     synced_order = mstest.get_order();
                     mstest.check_inclusion(share.admin_order, synced_order);

                 }, 10000)
             """,
             "timeout": 20000,
             },
            # demo compares order with his initial order
            {"session": "demo",
             "code": """
                 mstest.print_order();
                 synced_order = mstest.get_order();
                 /* this test is currently not supported: request from demo is ignored and his state is rollbacked */
                 // mstest.check_inclusion(share.demo_order, synced_order);
             """,
             },
            # demo is on
            {"session": "admin",
             "extra": "connection_on",
             },
            # ok
            {"session": "admin",
             "code": "console.log('ok');",
             },
        ], 120)
