# -*- coding: utf-8 -*-
from .common import TestCommon


class TestSync(TestCommon):
    def test_10_sessions(self):
        """Check framework"""
        self.phantom_js_multi({
            "admin": {
                "url_path": "/pos/web?debug",
                "login": "admin",
            },
            "demo": {
                "url_path": "/pos/web",
                "login": "demo",
            }
        }, [
            {"session": "admin",
             "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
             },
            {"session": "demo",
             "code": "$('.username:contains(Demo)').length || console.log('error', 'Demo label is not found');"
             },
            {"session": "admin",
             "code": "$('.username:contains(Administrator)').length || console.log('error', 'Administrator label is not found')",
             },
            {"session": "admin",
             "code": "console.log('ok')",
             },
        ], 120)

    def test_20_inject(self):
        self.phantom_js_multi({
            "admin": {
                "url_path": "/pos/web",
                "login": "admin",
            },
        }, [
            {"session": "admin",
             "code": "testInject()?console.log('ok'):console.log('error', 'js in not injected')",
             },
        ])
