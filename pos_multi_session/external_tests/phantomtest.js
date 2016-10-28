// Phantomjs odoo helper
// jshint evil: true, loopfunc: true
/*

Modified phantomtest.js from odoo ( https://github.com/odoo/odoo/blob/8.0/openerp/tests/phantomtest.js ). It accepts following extra parameters:

* ``sessions`` is dictonary of sessions::

  {"session1": {
  "url_path": "/web"
  "ready": "window",
  "login": "admin",
  "password": "admin", # by default is the same as login
  "timeout": 10, # page loading timeout
  }
  }

* ``commands`` is a list of commands::

  [{"session": "session1",
    "extra": "connection_on" | "connection_off"
    "code": "console.log('ok')",
    "ready": false, # wait before calling next command
    "timeout": 60, # code execution timeout
  }]

* code:

  * to communicate between commands, variable ``share`` can be used. It's saved right after execution finish. It's not save in async code (e.g. inside setTimeout function)

*/

var system = require('system');
function waitFor (condition, callback, timeout, timeoutMessageCallback) {
    timeout = timeout || 10000;
    var start = new Date();

    var prev_result=-1;
    (function waitLoop() {
        result = condition();
        if (result !== prev_result){
            prev_result = result;
            console.log("page.evaluate eval result:", result);
        }
        if(new Date() - start > timeout) {
            console.log('error', timeoutMessageCallback ? timeoutMessageCallback() : "Timeout after "+timeout+" ms");
            phantom.exit(1);
        } else if (result) {
            callback();
        } else {
            setTimeout(waitLoop, 250);
        }
    }());
}

function waitForReady (page, ready, callback, timeout){
    console.log("PhantomTest: wait for condition:", ready);
    waitFor(function() {
        return page.evaluate(function (ready) {
            var r = false;
            try {
                r = !!eval(ready);
            } catch(ex) {
            }
            return r;
        }, ready);
    }, callback, timeout);
}

function timeoutMessage (){
    return ("Timeout\nhref: " + window.location.href +
            "\nreferrer: " + document.referrer +
            "\n\n" + (document.body && document.body.innerHTML)).replace(/[^a-z0-9\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "*");
}

function blockConnection (requestData, networkRequest){
    console.log('block request', requestData.url);
    networkRequest.abort();
}

var tools = {'timeoutMessage': timeoutMessage};
var share = {};

function PhantomTest() {
    var self = this;
    this.options = JSON.parse(system.args[system.args.length-1]);
    this.inject = this.options.inject || [];
    this.origin = 'http://localhost';
    this.origin += this.options.port ? ':' + this.options.port : '';

    // ----------------------------------------------------
    // configure phantom and page
    // ----------------------------------------------------
    this.pages = {}; // sname -> page

    for (var sname in self.options.sessions){ 
        session = self.options.sessions[sname];
        session.timeout = session.timeout ? Math.round(parseFloat(session.timeout)*1000 - 5000) : 10000;

        var jar = require('cookiejar').create();
        this.page = require('webpage').create();
        this.page.cookieJar = jar;
        this.pages[sname] = this.page;
        jar.addCookie({
            'domain': 'localhost',
            'name': 'session_id',
            'value': session.session_id,
        });
        this.page.viewportSize = { width: 1366, height: 768 };
        this.page.onError = function(message, trace) {
            var msg = [message];
            if (trace && trace.length) {
                msg.push.apply(msg, trace.map(function (frame) {
                    var result = [' at ', frame.file, ':', frame.line];
                    if (frame.function) {
                        result.push(' (in ', frame.function, ')');
                    }
                    return result.join('');
                }));
                msg.push('(leaf frame on top)');
            }
            console.log('error', JSON.stringify(msg.join('\n')));
            phantom.exit(1);
        };
        this.page.onAlert = function(message) {
            console.log('error', message);
            phantom.exit(1);
        };

        this.page.onConsoleMessage = function(message) {
            console.log(message);
        };

        var pagesLoaded = false;
        (function(){
            // put it in function to have new variables scope
            // (self.page is changed)
            var page = self.page;

            setTimeout(function () {
                if (pagesLoaded)
                    return;
                page.evaluate(function (timeoutMessage) {
                    var message = timeoutMessage();
                    console.log('error', message);
                }, timeoutMessage);
                phantom.exit(1);
            }, session.timeout);

            var inject = session.inject;
            page.onLoadFinished = function(status) {
                if (status === "success") {
                    for (var k in inject) {
                        var found = false;
                        var v = inject[k];
                        var need = v;
                        var src = v;
                        if (v[0]) {
                            need = v[0];
                            src = v[1];
                            found = page.evaluate(function(code) {
                                try {
                                    return !!eval(code);
                                } catch (e) {
                                    return false;
                                }
                            }, need);
                        }
                        if(!found) {
                            console.log('Injecting', src, 'needed for', need);
                            if(!page.injectJs(src)) {
                                console.log('error', "Cannot inject " + src);
                                phantom.exit(1);
                            }
                        }
                    }
                }
            };


        })();

    }// for (var sname in self.options.sessions){ 


    // ----------------------------------------------------
    // run test
    // ----------------------------------------------------
    this.run = function() {
        // load pages and then call runCommands

        pages_count = 0;
        onPageReady = function() {
            pages_count--;
            console.log('onPageReady', pages_count);
            if (pages_count === 0){
                pagesLoaded = true;
                self.runCommands();
            }
        };


        for (var sname in self.pages){
            page = self.pages[sname];
            session = self.options.sessions[sname];
            var url = self.origin + session.url_path;


            // open page
            ready = session.ready || "true";

            pages_count++;
            (function(){
                var currentPage = page;
                console.log('start loading', url);
                currentPage.open(url, function(status) {
                    if (status !== 'success') {
                        console.log('error', "failed to load " + url);
                        phantom.exit(1);
                    } else {
                        console.log('loaded', url, status);
                        // clear localstorage leftovers
                        currentPage.evaluate(function () {localStorage.clear(); });
                        // process ready
                        waitForReady(page, ready, onPageReady, session.timeout);
                    }
                });
            })();
        }//for (var sname in self.pages){

    };

    this.runCommands = function() {
        console.log('runCommands', self.options.commands);
        var i = -1;
        var timer = null;
        function nextCommand(){
            if (timer){
                clearTimeout(timer);
            }
            i++;
            if (i == self.options.commands.length){
                return;
            }
            command = self.options.commands[i];
            sname = command.session;
            page = self.pages[sname];
            extra = command.extra;
            code = command.code || 'true';
            ready = command.ready || 'true';

            console.log("PhantomTest.runCommands: executing: " + code);
            (function(){
                var commandNum = i;
                timer = setTimeout(function () {
                    if (commandNum != i)
                        return;
                    page.evaluate(function (tools) {
                        var message = tools.timeoutMessage();
                        console.log('error', message);
                    }, tools);
                    phantom.exit(1);
                }, command.timeout || 60333);
            })();
            if (extra == 'connection_off'){
                console.log('connection is off for', sname);
                page.onResourceRequested = blockConnection;
            } else if (extra == 'connection_on'){
                page.onResourceRequested = null;
            }
            share = page.evaluate(function (code, tools, share) {
                eval(code);
                return share;
            }, code, tools, share);
            waitForReady(page, ready, nextCommand);
        }
        nextCommand();
    };

}

// js mode or jsfile mode
if(system.args.length === 2) {
    pt = new PhantomTest();
    pt.run();
}

// vim:et:
