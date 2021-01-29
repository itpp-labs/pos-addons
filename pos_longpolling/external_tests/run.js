/* eslint-disable */ // TODO: fix eslint if this file is used
/*
Script allows to run headless POS. It run POS scripts (e.g. sending longpolling requests) for TIMEOUT secs and then stops.

API

  phantomjs run.js POS_URL SESSION_ID TIMEOUT

e.g.

  phantomjs http://pos.10.local/pos/web 025590b63e43f9efe53d0096c5affbe69ddfc092 60


Usage:

* Open browser dev tools, switch to Network tab
* Open Odoo in a normal way
* Find **Cookie** header at any request
* Open POS in a normal way
* run in terminal

for i in `seq 100`; do /usr/local/bin/phantomjs run.js http://pos.10.local/pos/web 025590b63e43f9efe53d0096c5affbe69ddfc092 300 & ; done

-- will run 100 instances for 300 seconds


*/

var system = require("system");
var pos_url = system.args[1];
var session_id = system.args[2];
var timeout = parseInt(system.args[3]);
var pages_num = 1;

console.log("Open " + pages_num + " pages for " + timeout + " sec");

var domain = pos_url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i)[1];

phantom.addCookie({
    name: "session_id",
    value: session_id,
    domain: domain,
});

var pages = [];
for (var i = 0; i < pages_num; i++) {
    var page = require("webpage").create();

    page.open(pos_url, function(status) {
        console.log("Page #" + i + ": " + status);
    });
    pages.push(page);
}

setTimeout(function() {
    phantom.exit();
}, timeout * 1000);
