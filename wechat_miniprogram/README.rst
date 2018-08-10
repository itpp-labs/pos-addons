=========================
 WeChat mini-program API
=========================

Basic tools to integrate Odoo and WeChat mini-program.

.. contents::
   :local:

Payment method
==============

**Mini program** uses Official Account Payment method. For more information, please see the `WeChat Pay Interface Document <https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=7_3&index=1>`__

Developing mini-program
=======================

Authentication
--------------

To authenticate a user from the mini-program, you must send a request with a code and user information of the mini-program to the server. To receive the code and send the request, you must use ``wx.login`` provided by mini-program API. Odoo will create a user if one does not exist and assign session_id which has to be sent via a cookie on each RPC request.::

    function AuthenticateUser(code) {
      return new Promise(function(resolve, reject) {
        var userInfo = app.globalData.userInfo;
        code = code || false;
        function do_request() {
          var options = {
            url: 'https://ODOO_HOST/wechat/miniprogram/authenticate',
            header: {
              'Content-Type': 'application/json'
            },
            success: function(res) {
              // save session_id
              var data = res.data.result;
              if (data.session_id) {
                wx.setStorage({
                  key: 'session_id',
                  data: data.session_id,
                  success: function() {
                    resolve(data);
                  }
                })
              } else {
                reject(res);
              }
            },
            fail: function(res) {
              reject(res);
            }
          };

          var params = {
            context: {
            },
            code: code,
            user_info: userInfo
          };

          // send request to Odoo server
          wxJsonRpc(params, options);
        }

        if (code) {
          do_request();
        } else {
          wx.login({
            success: function(data) {
              code = data.code;
              do_request();
            }
          })
        }
      });
    }

RPC calls
---------

RPC request from mini-program::

    function odooRpc(params, options) {
      return new Promise(function(resolve, reject){
        options = options || {
        };
        function do_request(session_id) {
          options.url = 'https://ODOO_HOST/web/dataset/call_kw';
          options.header = {
            'Content-Type': 'applications/json',
            'X-Openerp-Session-Id': session_id
          };
          options.success = function(res) {
            var data = res.data.result;
            resolve(data);
          };
          options.fail = function(res) {
            reject(res);
          };
          wxJsonRpc(params, options);
        }
        wx.getStorage({
          key: 'session_id',
          success: function(res) {
            if (res.data) {
              do_request(res.data);
            } else {
              AuthenticateUser().then(function(data){
                do_request(data.session_id);
              });
            }
          },
          fail: function() {
            AuthenticateUser().then(function(data){
              do_request(data.session_id);
            });
          },
        });
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
       options.method = 'POST';
       // send request to Odoo server
       wx.request(options);
    }


**Example:**
Load Products from Odoo Server::

    var params = {
      models: 'product.product',
      method: 'search_read',
      args: [
      ],
      context: {
      },
      kwargs: {
        domain: [['sale_ok','=',true],['available_in_pos','=',true]],
        fields: ['display_name', 'list_price', 'lst_price', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id',
                'barcode', 'default_code', 'to_weight', 'uom_id', 'description_sale', 'description',
                'product_tmpl_id','tracking'],
      }
    }

    odooRpc(params).then(function(res) {
      console.log(res);
    });

**Result:** list of Products

Sandbox & Debugging of mini-program
===================================

* API Debug Console https://open.wechat.com/cgi-bin/newreadtemplate?t=overseas_open/docs/oa/basic-info/debug-console
* Creating Test Accounts https://admin.wechat.com/debug/cgi-bin/sandbox?t=sandbox/login

  * You will get ``sub_appid`` and ``sub_appsecret`` values for work with mini-programs

Credits
=======

Contributors
------------
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__

Sponsors
--------
* `Sinomate <http://sinomate.net/>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/misc-addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/wechat_miniprogram/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 11.0 ee2b9fae3519c2494f34dacf15d0a3b5bd8fbd06
