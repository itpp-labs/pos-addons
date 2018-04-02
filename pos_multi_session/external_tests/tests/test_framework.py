# -*- coding: utf-8 -*-
# Copyright 2016 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from .common import TestCommon


class TestSync(TestCommon):
    def test_10_sessions(self):
        """Check framework"""
        self.phantom_js_multi({
            "admin": {},
            "demo": {},
        }, [
            # check admin authentication
            {"session": "admin",
             "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
             },
            # extra time for demo
            {"session": "demo",
             "code": """
                 mstest.wait(function(){
                 }, 2000)
            """,
             },
            # check demo authentication
            {"session": "demo",
             "screenshot": "test-framework-user",
             "code": "$('.username:contains(Demo)').length || console.log('error', 'Demo label is not found');"
             },
            # check admin authentication
            {"session": "admin",
             "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
             },
            {"session": "admin",
             "code": "console.log('ok')",
             },
        ], 120)

    def test_20_inject(self):
        self.phantom_js_multi({
            "admin": {},
        }, [
            {"session": "admin",
             "code": "testInject()?console.log('ok'):console.log('error', 'js in not injected')",
             },
        ])
