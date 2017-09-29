# -*- coding: utf-8 -*-
import logging
import threading
from odoo.tools import config


_logger = logging.getLogger(__name__)


try:
    from twython import TwythonStreamer
    from escpos.printer import Network
except ImportError as err:
    TwythonStreamer = False
    _logger.debug(err)


class MyStreamerThread(threading.Thread):

    def __init__(self):
        threading.Thread.__init__(self, name='MyStreamerThread')
        self.daemon = True

    def run(self):
        _logger.info("MyStreamerThread started.")

        app_key = config['app_key']
        app_secret = config['app_secret']
        oauth_token = config['oauth_token']
        oauth_token_secret = config['oauth_token_secret']
        if TwythonStreamer is not False:
            stream = MyStreamer(app_key, app_secret, oauth_token, oauth_token_secret)
            stream.printer = False
            stream.statuses.filter(track='#OdooExperience,#OdooExperience2017')


class MyStreamer(TwythonStreamer):
    def on_success(self, data):
        if 'text' in data and 'retweeted_status' not in data:
            try:
                self.connect_to_printer()
                self.print_tweet(data)
            except:
                pass
                # TODO: Print logs

    def print_tweet(self, data):
        name = data['user']['name'] + '\n'
        self.printer.set()
        self.printer.text(name)

        login = '@' + data['user']['screen_name'] + '\n'
        self.printer.set()
        self.printer.text(login)

        self.printer.set()
        self.printer.text('\n')
        text = data['text'].encode('utf-8') + '\n'
        self.printer.text(text)
        self.printer.text('\n')
        if 'quoted_status' in data:
            self.printer.text("_______________________________________________\n\n")
            self.printer.set(font='b')
            quoted_name = data['quoted_status']['user']['name'] + ' '

            self.printer.text(quoted_name)
            quoted_login = '@' + data['quoted_status']['user']['screen_name'] + '\n'
            self.printer.text(quoted_login)
            self.printer.text('\n')
            quoted_text = data['quoted_status']['text'] + '\n'
            self.printer.set(align='right', font='b')
            self.printer.text(quoted_text)
            self.printer.text('\n')
            self.printer.set()
            self.printer.text("_______________________________________________\n\n")

        date = data['created_at'] + '\n'
        self.printer.set(font='b')
        self.printer.text(date)
        self.printer.cut()

    def connect_to_printer(self):
        NETWORK_PRINTER_IP = config['printer_ip']
        if self.printer:
            self.printer.close()
        try:
            self.printer = Network(NETWORK_PRINTER_IP)
        except:
            _logger.error("Can not get printer with IP: %s" % NETWORK_PRINTER_IP)
            self.printer = False

    def on_error(self, status_code, data):
        _logger.error("Can not printing tweets: %s" % status_code)


my_streamer = MyStreamerThread()
my_streamer.start()
