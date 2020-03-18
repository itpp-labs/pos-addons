# -*- coding: utf-8 -*-
# Copyright 2016-2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2016 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).

from .common import TestCommon


class TestSync(TestCommon):
    def test_10_new_order(self):
        """Simplest case. Sync new order"""
        self.phantom_js_multi(
            {
                # use default settings for sessions (see ./common.py)
                "demo": {},
                "admin": {},
            },
            [
                # initialisation
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
                    "timeout": 35000,
                },
                # check admin authentication
                {
                    "session": "admin",
                    "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
                },
                # check demo authentication
                {
                    "session": "demo",
                    "code": "$('.username:contains(Demo)').length || console.log('error', 'Demo label is not found');",
                },
                # admin removes orders
                {
                    "session": "admin",
                    "code": """
                 console.log('test_10_new_order');
                 mstest.remove_all_orders();
            """,
                },
                # demo removes orders
                {
                    "session": "demo",
                    "code": """
                 mstest.wait(function(){
                     mstest.remove_all_orders();
                 })
            """,
                },
                # admin fills order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                 }, 3000)
             """,
                },
                # admin gets order
                {
                    "session": "admin",
                    "code": """
                  share.order = mstest.get_order();
              """,
                },
                # extra time for demo
                {
                    "session": "demo",
                    "screenshot": "before-wait",
                    "code": """
                 mstest.wait(function(){
                 }, 5000)
            """,
                },
                # demo syncs order
                {
                    "session": "demo",
                    "screenshot": "after-wait",
                    "code": """
                mstest.find_order(share.order);
             """,
                },
                # TODO: admin close order (make a payment)
                # TODO: demo syncs order
                # ok
                {"session": "demo", "code": "console.log('ok');"},
            ],
            120,
        )

    def test_20_offline_update_order(self):
        """One POS is offline, while another update order"""
        self.phantom_js_multi(
            {
                # use default settings for sessions (see ./common.py)
                "admin": {},
                "demo": {},
            },
            [
                # initialisation
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
                    "timeout": 35000,
                },
                # check admin authentication
                {
                    "session": "admin",
                    "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
                },
                # check demo authentication
                {
                    "session": "demo",
                    "code": "$('.username:contains(Demo)').length || console.log('error', 'Demo label is not found');",
                },
                # admin removes orders
                {
                    "session": "admin",
                    "code": """
                 console.log('test_20_offline');
                 mstest.remove_all_orders();
             """,
                },
                # demo removes orders
                {
                    "session": "demo",
                    "code": """
                 mstest.wait(function(){
                    mstest.remove_all_orders();
                 })
             """,
                },
                # admin fills order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                 }, 5000)
             """,
                },
                # admin gets order
                {
                    "session": "admin",
                    "code": """
                  share.order = mstest.get_order();
              """,
                },
                # demo syncs order
                {
                    "session": "demo",
                    "code": """
                 mstest.wait(function(){
                     mstest.find_order(share.order);
                 }, 5000)
             """,
                },
                # demo is off
                {"session": "demo", "extra": "connection_off"},
                # admin updates order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                    mstest.fill_order();
                    mstest.print_order();
                 }, 3000)
             """,
                },
                # GC
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                     mstest.gc();
                 }, 20000);
             """,
                    "timeout": 25000,
                },
                # demo creates new order
                {
                    "session": "demo",
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
                {"session": "demo", "extra": "connection_on"},
                # admin updates order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 share.order = mstest.get_order();
                 mstest.wait(function(){
                     mstest.check_revision_error();
                 }, 5000)
             """,
                },
                # check sync on demo
                {
                    "session": "demo",
                    "code": """
             mstest.wait(function(){
                mstest.find_order(share.order);
            }, 10000)
             """,
                    "timeout": 25000,
                },
                # ok
                {
                    "session": "demo",
                    "screenshot": "test-20-final",
                    "code": "console.log('ok');",
                },
            ],
            240,
        )

    def test_21_offline_remove_order(self):
        """One POS is offline, while another remove order"""
        self.phantom_js_multi(
            {
                # use default settings for sessions (see ./common.py)
                "admin": {},
                "demo": {},
            },
            [
                # initialisation
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
                    "timeout": 35000,
                },
                # check admin authentication
                {
                    "session": "admin",
                    "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
                },
                # check demo authentication
                {
                    "session": "demo",
                    "code": "$('.username:contains(Demo)').length || console.log('error', 'Demo label is not found');",
                },
                # admin removes orders
                {
                    "session": "admin",
                    "code": """
                 console.log('test_21_offline_remove_order');
                 mstest.remove_all_orders();
             """,
                },
                # demo removes orders
                {
                    "session": "demo",
                    "code": """
                 mstest.wait(function(){
                    mstest.remove_all_orders();
                 })
             """,
                },
                # admin fills order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                 })
             """,
                },
                # admin gets order
                {
                    "session": "admin",
                    "code": """
                  share.order = mstest.get_order();
              """,
                },
                # demo syncs order
                {
                    "session": "demo",
                    "code": """
                 mstest.wait(function(){
                     mstest.find_order(share.order);
                 })
             """,
                },
                # demo is off
                {"session": "demo", "extra": "connection_off"},
                # admin removes order
                #
                # we fill order before removing,
                # because framework doesn't switch connnection off immediately
                # and we need to send some data to the last working polling
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.wait(function(){
                    mstest.remove_current_order()
                 }, 3000)
             """,
                },
                # GC
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                     mstest.gc();
                 }, 2000);
             """,
                },
                # demo creates new order (to start reconnection process)
                {
                    "session": "demo",
                    "code": """
                console.log('demo creates new order (to start reconnection process)')
                mstest.new_order();
                mstest.fill_order();
                mstest.wait(function(){
                    mstest.fill_order();
                }, 6000);
             """,
                },
                # demo is on
                {"session": "demo", "extra": "connection_on"},
                # admin updates another order
                # (probably this is not necessary step)
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
             """,
                },
                # check sync on demo
                {
                    "session": "demo",
                    "code": """
             mstest.wait(function(){
                 if (mstest.order_exists(share.order)){
                     console.log('error', 'removed order still exists', share.order.order_num)
                 }
            }, 20000)
             """,
                    "timeout": 25000,
                },
                # ok
                {"session": "demo", "code": "console.log('ok');"},
            ],
            120,
        )

    def test_30_slow(self):
        """Two POSes update the same order simultinously"""
        self.phantom_js_multi(
            {
                # use default settings for sessions (see ./common.py)
                "admin": {},
                "demo": {},
            },
            [
                # initialisation
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                 }, 30000)
             """,
                    "timeout": 35000,
                },
                # check admin authentication
                {
                    "session": "admin",
                    "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
                },
                # check demo authentication
                {
                    "session": "demo",
                    "code": "$('.username:contains(Demo)').length || console.log('error', 'Demo label is not found');",
                },
                # admin removes orders
                {
                    "session": "admin",
                    "code": """
                 console.log('test_30_slow');
                 mstest.remove_all_orders();
             """,
                },
                # demo removes orders
                {
                    "session": "demo",
                    "code": """
                 mstest.wait(function(){
                    mstest.remove_all_orders();
                 })
             """,
                },
                # admin creates order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.print_order();
                 mstest.wait(function(){
                 })
             """,
                },
                # admin gets order
                {
                    "session": "admin",
                    "code": """
                 share.admin_order = mstest.get_order();
             """,
                },
                # demo switches to order
                {
                    "session": "demo",
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
                {
                    "session": "admin",
                    "extra": "connection_slow",
                    "code": """
                 console.log("demo's connection is slow down")
             """,
                },
                # admin waits and updates order
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                     console.log('Admin updates Order')
                     mstest.fill_order();
                 }, 5000)
             """,
                },
                # admin saves order
                {
                    "session": "admin",
                    "code": """
                 share.admin_order = mstest.get_order();
                 mstest.print_order();
             """,
                },
                # demo updates order immediately
                {
                    "session": "demo",
                    "code": """
                 console.log('Demo updates Order')
                 mstest.fill_order();
                 share.demo_order = mstest.get_order();
             """,
                },
                # admin waits compares order with his initial order
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                     mstest.print_order();
                     synced_order = mstest.get_order();
                     mstest.check_inclusion(share.admin_order, synced_order);

                 }, 20000)
             """,
                    "timeout": 30000,
                },
                # demo compares order with his initial order
                {
                    "session": "demo",
                    "code": """
                 mstest.print_order();
                 synced_order = mstest.get_order();
                 /* this test is currently not supported: request from demo is ignored and his state is rollbacked */
                 // mstest.check_inclusion(share.demo_order, synced_order);
             """,
                },
                # demo is on
                {"session": "admin", "extra": "connection_on"},
                # ok
                {"session": "admin", "code": "console.log('ok');"},
            ],
            120,
        )

    def test_31_queue(self):
        """Single POS send two update request.
        It would raise error 'sync conflicts', if there are no queue for sending updates. For example
        * Order has revision_ID equal to 10
        * We send first update
        * We send second update
        * First request is reached the server. Server sets  revision_ID equal to 11
        * Second request is reached the server. Server return revision_error, because in request revision_ID is 10, while server has revision_ID 11
        """

        # current postpone timer for sending updates is 1000 ms
        # connection_slow delay response to 3000 ms

        self.phantom_js_multi(
            {
                # use default settings for sessions (see ./common.py)
                "admin": {}
            },
            [
                # admin removes orders
                {
                    "session": "admin",
                    "code": """
                 console.log('test_31_slow');
                 mstest.remove_all_orders();
             """,
                },
                # check admin authentication
                {
                    "session": "admin",
                    "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
                },
                # admin creates order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.print_order();
                 mstest.wait(function(){
                 })
             """,
                },
                # response for admin requests are delayed for 3 seconds
                {
                    "session": "admin",
                    "extra": "connection_slow",
                    "code": """
                 console.log("admin requests are delayed")
             """,
                },
                # admin updates order
                {
                    "session": "admin",
                    "code": """
                 console.log('Admin updates Order')
                 mstest.fill_order();
                 console.log('Admin waits to send update request')
                 mstest.wait(function(){
                 }, 1500)
             """,
                },
                # admin updates order again
                {
                    "session": "admin",
                    "code": """
                 console.log('Admin updates Order again')
                 mstest.fill_order();
             """,
                },
                # admin waits and receives error if queue doesn't work
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                     mstest.check_revision_error();
                 }, 10000)
             """,
                    "timeout": 20000,
                },
                # connection is on
                {"session": "admin", "extra": "connection_on"},
                # ok
                {
                    "session": "admin",
                    "screenshot": "test-31-final",
                    "code": "console.log('ok');",
                },
            ],
            120,
        )

    def test_32_queue_for_removing(self):
        """Single POS send remove order request that confuses update requests.
        It would raise error 'sync conflicts', if there are no queue for removing an order. For example
        * We send some updates
        * We remove order
        * Updates in queue are reaching a server. Server sets  revision_ID for each update.
        * Removing order request reach the server without waiting in the queue.
        * Server return 'error during synchronization', because requests in the queue keep going processing for already deleted order.
        """

        # current postpone timer for sending updates is 1000 ms
        # connection_slow delay response to 3000 ms

        self.phantom_js_multi(
            {
                # use default settings for sessions (see ./common.py)
                "admin": {}
            },
            [
                # admin removes orders
                {
                    "session": "admin",
                    "code": """
                 console.log('test_32_slow');
                 mstest.remove_all_orders();
             """,
                },
                # check admin authentication
                {
                    "session": "admin",
                    "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
                },
                # admin creates order
                {
                    "session": "admin",
                    "code": """
                 mstest.fill_order();
                 mstest.print_order();
                 mstest.wait(function(){
                 })
             """,
                },
                # response for admin requests are delayed for 3 seconds
                {
                    "session": "admin",
                    "extra": "connection_slow",
                    "code": """
                 console.log("admin requests are delayed")
             """,
                },
                # admin updates order
                {
                    "session": "admin",
                    "code": """
                 console.log('Admin updates Order')
                 mstest.fill_order();
                 console.log('Admin updates Order')
                 mstest.fill_order();
                 console.log('Admin updates Order')
                 mstest.fill_order();
                 console.log('Admin waits to send update request')
                 mstest.wait(function(){
                 }, 1500)
             """,
                },
                # admin remove order
                {
                    "session": "admin",
                    "code": """
                 console.log('Admin removes Order')
                 mstest.remove_all_orders();
             """,
                },
                # admin waits and receives error if queue doesn't work
                {
                    "session": "admin",
                    "code": """
                 mstest.wait(function(){
                     mstest.check_revision_error();
                 }, 10000)
             """,
                    "timeout": 20000,
                },
                # connection is on
                {"session": "admin", "extra": "connection_on"},
                # ok
                {
                    "session": "admin",
                    "screenshot": "test-32-final",
                    "code": "console.log('ok');",
                },
            ],
            120,
        )
