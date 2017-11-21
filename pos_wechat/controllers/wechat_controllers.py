from __future__ import absolute_import, unicode_literals
import os
import json, requests, time
from flask import Flask, request, abort, render_template
from wechatpy import parse_message, create_reply
from wechatpy.utils import check_signature
from wechatpy.exceptions import (
    InvalidSignatureException,
    InvalidAppIdException,
)

try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    BusController = object

# set token or get from environments
# APPID = request.env['wechat.model'].appId
# AES_KEY = request.env['wechat.model'].appSecret
# TOKEN = request.env['wechat.model'].token

app = Flask(__name__)


class Controller(BusController):

    @app.route('/')
    def index(self):
        host = request.url_root
        return render_template('index.html', host=host)


    @app.route('/wechat', methods=['GET', 'POST'])
    def wechat(self, **post):
        # sign check all other im model
        AES_KEY = request.env['ir.config_parameter'].get_param('wechat.appSecret')
        APPID = request.env['ir.config_parameter'].get_param('wechat.appId')
        TOKEN = request.env['ir.config_parameter'].get_param('wechat.token')
        signature = post.get('signature', '')
        timestamp = post.get('timestamp', '')
        nonce = post.get('nonce', '')
        encrypt_type = post.get('encrypt_type', 'raw')
        msg_signature = post.get('msg_signature', '')
        try:
            # request.env['wechat.server'].check_signature(post)
            check_signature(TOKEN, signature, timestamp, nonce)
        except InvalidSignatureException:
            return request.render("website.403")
        if request.method == 'GET':
            echo_str = post.get('echostr', '')
            return echo_str

        # POST request
        if encrypt_type == 'raw':
            # plaintext mode
            msg = parse_message(request.data)
            if msg.type == 'text':
                reply = create_reply(msg.content, msg)
            else:
                reply = create_reply('Sorry, can not handle this for now', msg)
            return reply.render()
        else:
            # encryption mode
            from wechatpy.crypto import WeChatCrypto

            crypto = WeChatCrypto(TOKEN, AES_KEY, APPID)
            try:
                msg = crypto.decrypt_message(
                    request.data,
                    msg_signature,
                    timestamp,
                    nonce
                )
            except (InvalidSignatureException, InvalidAppIdException):
                return request.render("website.403")
            else:
                msg = parse_message(msg)
                if msg.type == 'text':
                    reply = create_reply(msg.content, msg)
                else:
                    reply = create_reply('Sorry, can not handle this for now', msg)
                return crypto.encrypt_message(reply.render(), nonce, timestamp)
