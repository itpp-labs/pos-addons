============
 WeChat API
============

Basic tools to integrate Odoo and WeChat.

.. contents::
   :local:

Payment methods
===============

Quick Pay (micropay)
--------------------

Buyer presents the pay code, Vendor scans the code to finish the transaction.

Native Payment (QR Code Payment)
--------------------------------

The Vendor gets one-time url and shows it to Buyer as a QR Code, Buyer scans to finish the transaction.

Official Account Payment
------------------------

There are two types of usage:

* **In-App Web-based Payment** -- The Payer opens the Vendor's HTML5 pages on their WeChat and calls the WeChat payment module via the JSAPI interface to pay their transaction. Client side of this process (i.e. web pages) is not supported. While it could be implemented as additional module, we recommend to develop *Mini programs* instead.
* **Mini program** -- an application as a part of WeChat App is created via *WeChat Developer tools*.

In-App Payment
--------------

This payment way is only for native mobile application. This module provides server part of the process.

Development mini-program
========================

Authentication
--------------

To authenticate a user from the mini-program, you must send a request with a code and user information of the mini-program to the server. To receive the code and send the request, you must use ``wx.login`` provided by mini-program API. Odoo will create a user if one does not exist and assign session_id which has to be sent via a cookie on each RPC request.

.. code-block:: js

    function AuthenticateUser(callback) {
       // get user code
       wx.login({
         success: function(data) {
            // get user info
            wx.getUserInfo({
               success: function(user_info) {
                  var options = {
                     'url': 'https://ODOO_HOST/wechat/miniprogram/authenticate',
                     'success': function() {
                        // save session id
                        wx.setStorage({
                           key: 'session_id',
                           data: session_info.session_id,
                           success: function() {
                              callback(session_info.session_id);
                           },
                        });
                     },
                  };
                  var params = {
                     'context': {},
                     "code": data.code,
                     "user_info": user_info.userInfo,
                  };
                  // send request to server
                  wxJsonRpc(params, options);
               }
            });
         }
       });
    }


RPC calls
---------

.. code-block:: js

    function rpc(params, options) {

       function do(session_id) {
          options.url = 'https://ODOO_HOST/web/dataset/call_kw';
          options.header = {
             'Content-Type': 'application/json',
             'Set-Cookie': 'session_id='+session_id,
          };
          wxJsonRpc(params, options);
       }

       wx.getStorage({
          key: 'session_id',
          success: function(res) {
             do(res.data);
          },
          fail: function() {
             AuthenticateUser(do);
          },
       });
    }

    function wxJsonRpc(params, options) {
       var data = {
          "jsonrpc": "2.0",
          "method": "call",
          "params": params,
          "id": Math.floor(Math.random() * 1000 * 1000 * 1000),
       }
       options.data = JSON.stringify(data);
       options.dataType = 'json';
       options.method = POST';
       // send request to server
       wx.request(options);
    }

**Example:**
Load Products from Odoo Server

.. code-block:: js

    var params = {
       models: 'product.product',
       method: 'search_read',
       domain: [['sale_ok','=',true],['available_in_pos','=',true]],
       fields: ['display_name', 'list_price', 'lst_price', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id',
                'barcode', 'default_code', 'to_weight', 'uom_id', 'description_sale', 'description',
                'product_tmpl_id','tracking'],
       context: {},
    }

    var options = {
       success: function(res) {
          console.log('Products', res);
       },
       fail: function(res) {
          console.log('Products is not loaded', res);
       }
    }

    rpc(params, options)

**Result:** list of Products

WeChat Documentation & tools
============================

Sandbox & Debugging
-------------------

* API Debug Console https://open.wechat.com/cgi-bin/newreadtemplate?t=overseas_open/docs/oa/basic-info/debug-console
* Creating Test Accounts https://admin.wechat.com/debug/cgi-bin/sandbox?t=sandbox/login

  * Note: it may not work from non-chinese IP addresses
  * You will get ``appid`` and ``appsecret`` values
  * To work with WeChat payments you also need Merchant ID, which this sandbox
    doesn't provide. It seems, that to work with Payments you need a real
    account and use *sandbox* mode (*System Parameter* ``wechat.sandbox``).

Payments
--------

* https://pay.weixin.qq.com/wechatpay_guide/help_docs.shtml

Debugging
=========

Local Debug
-----------

To debug UI, create *System Parameter* ``wechat.local_sandbox`` with value ``1``. All requests to wechat will return fake result without making a request.

Native Payments debugging
-------------------------

* It seems that in sandbox mode it's allowed to use only prices ``1.01`` and ``1.02``.

Showing QR
==========

The module contains js lib, but don't use it. The js lib can be attached to
corresponding assets in other modules (e.g. to *pos assets* in ``pos_wechat``
module).

Credits
=======

Contributors
------------
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/misc-addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/wechat/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
