from __future__ import absolute_import, unicode_literals
import odoo
from odoo.http import request
from wechatpy import parse_message, create_reply
from wechatpy.utils import check_signature
from wechatpy.exceptions import (
    InvalidSignatureException,
    InvalidAppIdException,
)

# set token or get from environments
# APPID = request.env['wechat.model'].appId
# AES_KEY = request.env['wechat.model'].appSecret
# TOKEN = request.env['wechat.model'].token


class WechatController(odoo.http.Controller):

    @odoo.http.route('/wechat', methods=['GET', 'POST'], auth='public')
    def wechat(self, **post):
        # sign check all other im model
        print('entered--------------')
        # AES_KEY = request.env['ir.config_parameter'].get_param('wechat.appSecret')
        # APPID = request.env['ir.config_parameter'].get_param('wechat.appId')
        # TOKEN = request.env['ir.config_parameter'].get_param('wechat.token')
        AES_KEY = 'wxae8ec5c35915fe27'
        APPID = '5cf76a750158b1e948d4680209c38ec4'
        TOKEN = '_dRQgeKeVs2AuPLNq2gPu1Gi9LqY-s1O7BgsYKrxuZrISDmxOz5Dc_2CRBrNBEmvNmGSmzoDPbj5EP1gKg0EA4VmckhvlIEdViZy-IqPApU_o40_OEApOFcHuPX6XKvtWDLaAIALSA'
        signature = post.get('signature', '')
        timestamp = post.get('timestamp', '')
        nonce = post.get('nonce', '')
        encrypt_type = post.get('encrypt_type', 'raw')
        msg_signature = post.get('msg_signature', '')
        print('signature:', signature)
        print('timestamp: ', timestamp)
        print('nonce:', nonce)
        print('encrypt_type:', encrypt_type)
        print('msg_signature:', msg_signature)
        try:
            # request.env['wechat.server'].check_signature(post)
            print('try_check_signature--------------')
            check_signature(TOKEN, signature, timestamp, nonce)
        except InvalidSignatureException:
            print('except-request-------------')
            # return request.render("website.403")
            reply = create_reply('Sorry, request doesnt work')
            return reply.render()
        if request.method == 'GET':
            print('if-echo_str-------------')
            echo_str = post.get('echostr', '')
            return echo_str

        # POST request
        if encrypt_type == 'raw':
            # plaintext mode
            print('if-encrypt_type == "raw"-------------')
            msg = parse_message(request.data)
            if msg.type == 'text':
                print('if-create_reply -------------')
                reply = create_reply(msg.content, msg)
            else:
                print('if-create_reply Sorry,-------------')
                reply = create_reply('Sorry, can not handle this for now', msg)
            return reply.render()
        else:
            print('if-encrypt_type == "raw"-------------')
            # encryption mode
            from wechatpy.crypto import WeChatCrypto

            crypto = WeChatCrypto(TOKEN, AES_KEY, APPID)
            try:
                print('inside try of encrypting')
                msg = crypto.decrypt_message(
                    request.data,
                    msg_signature,
                    timestamp,
                    nonce
                )
            except (InvalidSignatureException, InvalidAppIdException):
                # return request.render("website.403")
                print('inside except of encrypting')
                reply = create_reply('Sorry, request doesnt work')
                return reply.render()
            else:
                print('inside else of encrypting')
                msg = parse_message(msg)
                if msg.type == 'text':
                    reply = create_reply(msg.content, msg)
                else:
                    reply = create_reply('Sorry, can not handle this for now', msg)
                print(msg)
                return crypto.encrypt_message(reply.render(), nonce, timestamp)
