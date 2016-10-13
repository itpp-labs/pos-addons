;function getterSetter(variableParent, variableName, getterFunction, setterFunction) {
    if (Object.defineProperty) {
        Object.defineProperty(variableParent, variableName, {
            get: getterFunction,
            set: setterFunction
        });
    }
    else if (document.__defineGetter__) {
        variableParent.__defineGetter__(variableName, getterFunction);
        variableParent.__defineSetter__(variableName, setterFunction);
    }
}

(function (w) {
    w.onlinejs = w.onlinejs || {};

    //Checks interval can be changed in runtime
    w.onLineCheckTimeout = 60*1000;

    //Use window.onLineURL incapsulated variable
    w.onlinejs._onLineURL = "/pos_multi_session/connection";

    w.onlinejs.setOnLineURL = function (newURL) {
        w.onlinejs._onLineURL = newURL;
        w.onlinejs.getStatusFromNavigatorOnLine();
    };

    w.onlinejs.getOnLineURL = function () {
        return w.onlinejs._onLineURL;
    };

    getterSetter(w, 'onLineURL', w.onlinejs.getOnLineURL, w.onlinejs.setOnLineURL);


    //Verification logic
    w.onlinejs.setStatus = function (newStatus) {
        w.onlinejs.fireHandlerDependOnStatus(newStatus);
        w.onLine = newStatus;
    };

    w.onlinejs.fireHandlerDependOnStatus = function (newStatus) {
        if (newStatus === true && w.onLineHandler !== undefined && (w.onLine !== true || w.onlinejs.handlerFired === false)) {
            w.onLineHandler();
        }
        if (newStatus === false && w.offLineHandler !== undefined && (w.onLine !== false || w.onlinejs.handlerFired === false)) {
            w.offLineHandler();
        }
        w.onlinejs.handlerFired = true;
    };

    w.onlinejs.startCheck = function () {
        setInterval("window.onlinejs.logic.checkConnectionWithRequest(true)", w.onLineCheckTimeout)
    };

    w.onlinejs.stopCheck = function () {
        clearInterval("window.onlinejs.logic.checkConnectionWithRequest(true)", w.onLineCheckTimeout);
    };

    w.checkOnLine = function () {
        w.onlinejs.logic.checkConnectionWithRequest(false);
    };

    w.onlinejs.getOnLineCheckURL = function () {
        return w.onlinejs._onLineURL + '?' + Math.floor(Math.random() * 1000000);
        //return w.onlinejs._onLineURL + '?' + Math.floor(Math.random() * 1000000);
    };

    w.onlinejs.getStatusFromNavigatorOnLine = function () {
        if (w.navigator.onLine !== undefined) {
            w.onlinejs.setStatus(w.navigator.onLine);
        } else {
            w.onlinejs.setStatus(true);
        }
    };

    //Network transport layer
    var xmlhttp = new XMLHttpRequest();

    w.onlinejs.isXMLHttp = function () {
        return "withCredentials" in xmlhttp;
    };

    w.onlinejs.isXDomain = function () {
        return typeof XDomainRequest != "undefined";
    };

    //For IE we use XDomainRequest and sometimes it uses a bit different logic, so adding decorator for this
    w.onlinejs.XDomainLogic = {
        init: function () {
            xmlhttp = new XDomainRequest();
            xmlhttp.onerror = function () {
                xmlhttp.status = 404;
                w.onlinejs.processXmlhttpStatus();
            };
            xmlhttp.ontimeout = function () {
                xmlhttp.status = 404;
                w.onlinejs.processXmlhttpStatus();
            };
        },
        onInternetAsyncStatus: function () {
            try {
                xmlhttp.status = 200;
                w.onlinejs.processXmlhttpStatus();
            } catch (err) {
                w.onlinejs.setStatus(false);
            }
        },
        checkConnectionWithRequest: function (async) {
            xmlhttp.onload = w.onlinejs.logic.onInternetAsyncStatus;

            var url = w.onlinejs.getOnLineCheckURL();

            xmlhttp.open("GET", url);
            w.onlinejs.tryToSend(xmlhttp);
        }
    };

    //Another case for decoration is XMLHttpRequest
    w.onlinejs.XMLHttpLogic = {
        init: function () {

        },
        onInternetAsyncStatus: function () {
            if (xmlhttp.readyState === 4) {
                try {
                    w.onlinejs.processXmlhttpStatus();
                } catch (err) {
                    w.onlinejs.setStatus(false);
                }
            }
        },
        checkConnectionWithRequest: function (async) {
            if (async) {
                xmlhttp.onreadystatechange = w.onlinejs.logic.onInternetAsyncStatus;
            } else {
                xmlhttp.onreadystatechange = undefined;
            }

            var url = w.onlinejs.getOnLineCheckURL();
            xmlhttp.open("HEAD", url, async);
            w.onlinejs.tryToSend(xmlhttp);

            if (async === false) {
                w.onlinejs.processXmlhttpStatus();
                return w.onLine;
            }
        }
    };

    if (w.onlinejs.isXDomain()) {
        w.onlinejs.logic = w.onlinejs.XDomainLogic;
    } else {
        w.onlinejs.logic = w.onlinejs.XMLHttpLogic;
    }

    w.onlinejs.processXmlhttpStatus = function () {
        var tempOnLine = w.onlinejs.verifyStatus(xmlhttp.status);
        w.onlinejs.setStatus(tempOnLine);
    };

    w.onlinejs.verifyStatus = function (status) {
        return status === 200;
    };

    w.onlinejs.tryToSend = function (xmlhttprequest) {
        try {
            xmlhttprequest.send();
        } catch(e) {
            w.onlinejs.setStatus(false);
        }
    };

    //Events handling
    w.onlinejs.addEvent = function (obj, type, callback) {
        if (window.attachEvent) {
            obj.attachEvent('on' + type, callback);
        } else {
            obj.addEventListener(type, callback);
        }
    };

    w.onlinejs.addEvent(w, 'load', function () {
        w.onlinejs.fireHandlerDependOnStatus(w.onLine);
    });

    w.onlinejs.addEvent(w, 'online', function () {
        window.onlinejs.logic.checkConnectionWithRequest(true);
    });

    w.onlinejs.addEvent(w, 'offline', function () {
        window.onlinejs.logic.checkConnectionWithRequest(true);
    });

    w.onlinejs.getStatusFromNavigatorOnLine();
    w.onlinejs.logic.init();
    w.checkOnLine();
    w.onlinejs.startCheck();
    w.onlinejs.handlerFired = false;
})(window);
