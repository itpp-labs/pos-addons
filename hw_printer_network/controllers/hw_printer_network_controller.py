# Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Tom Blauwendraat <tom@sunflowerweb.nl>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import http
import logging
import time
import socket
import subprocess
import threading
import traceback


_logger = logging.getLogger(__name__)


try:
    from odoo.addons.hw_escpos.escpos import escpos
    from odoo.addons.hw_escpos.controllers.main import EscposProxy
    from odoo.addons.hw_escpos.controllers.main import EscposDriver
    from odoo.addons.hw_escpos.escpos.printer import Network
    import odoo.addons.hw_proxy.controllers.main as hw_proxy
except ImportError:
    EscposProxy = object
    EscposDriver = object


class PingProcess(threading.Thread):
    def __init__(self, ip):
        self.stdout = None
        self.stderr = None
        threading.Thread.__init__(self)
        self.status = 'offline'
        self.ip = ip
        self.stop = False

    def run(self):
        while not self.stop:
            child = subprocess.Popen(
                ["ping", "-c1", "-w5", self.ip],
                shell=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            child.communicate()
            self.status = 'offline' if child.returncode else 'online'
            time.sleep(1)

    def get_status(self):
        return self.status

    def __del__(self):
        self.stop = True


class EscposNetworkDriver(EscposDriver):

    def __init__(self):
        self.network_printers = []
        self.ping_processes = {}
        self.printer_objects = {}
        super(EscposNetworkDriver, self).__init__()

    def get_network_printer(self, ip, name=None):
        found_printer = False
        for printer in self.network_printers:
            if printer['ip'] == ip:
                found_printer = True
                if name:
                    printer['name'] = name
                if printer['status'] == 'online':
                    printer_object = self.printer_objects.get(ip, None)
                    if not printer_object:
                        try:
                            printer_object = Network(ip)
                            self.printer_objects[ip] = printer_object
                        except socket.error:
                            pass
                    return printer
        if not found_printer:
            self.add_network_printer(ip, name)
        return None

    def add_network_printer(self, ip, name=None):
        printer = dict(
            ip=ip,
            status='offline',
            name=name or 'Unnamed printer'
        )
        self.network_printers.append(printer)  # dont return because offline
        self.start_pinging(ip)

    def start_pinging(self, ip):
        pinger = PingProcess(ip)
        self.ping_processes[ip] = pinger
        pinger.start()

    def update_driver_status(self):
        count = len([p for p in self.network_printers if p.get('status', None) == 'online'])
        if count:
            self.set_status('connected', '{} printer(s) Connected'.format(count))
        else:
            self.set_status('disconnected', 'Disconnected')

    def run(self):
        if not escpos:
            _logger.error('ESC/POS cannot initialize, please verify system dependencies.')
            return
        while True:
            try:
                error = True
                timestamp, task, data = self.queue.get(True)
                if task == 'xml_receipt':
                    error = False
                    if timestamp >= (time.time() - 1 * 60 * 60):
                        receipt, network_printer_ip = data
                        printer_info = self.get_network_printer(network_printer_ip)
                        printer = self.printer_objects.get(network_printer_ip, None)
                        if printer_info and printer_info['status'] == 'online' and printer:
                            _logger.info('Printing XML receipt on printer %s...', network_printer_ip)
                            try:
                                printer.receipt(receipt)
                            except socket.error:
                                printer.open()
                                printer.receipt(receipt)
                            _logger.info('Done printing XML receipt on printer %s', network_printer_ip)
                        else:
                            _logger.error('xml_receipt: printer offline!')
                            # add a missed order to queue
                            time.sleep(3)
                            self.queue.put((timestamp, task, data))
                elif task == 'printstatus':
                    pass
                elif task == 'status':
                    error = False
                    for printer in self.network_printers:
                        ip = printer['ip']
                        pinger = self.ping_processes.get(ip, None)
                        if pinger and pinger.isAlive():
                            status = pinger.get_status()
                            if status != printer['status']:
                                # todo: use a lock?
                                printer['status'] = status
                                self.update_driver_status()
                        else:
                            self.start_pinging(ip)
                error = False
            except Exception as e:
                self.set_status('error', str(e))
                errmsg = str(e) + '\n' + '-'*60+'\n' + traceback.format_exc() + '-'*60 + '\n'
                _logger.error(errmsg)
            finally:
                if error:
                    self.queue.put((timestamp, task, data))


# Separate instance, mainloop and queue for network printers
# original driver runs in parallel and deals with USB printers
network_driver = EscposNetworkDriver()

hw_proxy.drivers['escpos_network'] = network_driver

# this will also start the message handling loop
network_driver.push_task('printstatus')


class UpdatedEscposProxy(EscposProxy):
    @http.route('/hw_proxy/print_xml_receipt', type='json', auth='none', cors='*')
    def print_xml_receipt(self, receipt, proxy=None):
        if proxy:
            network_driver.push_task('xml_receipt', (receipt, proxy))
        else:
            super(UpdatedEscposProxy, self).print_xml_receipt(receipt)

    @http.route('/hw_proxy/network_printers', type='json', auth='none', cors='*')
    def network_printers(self, network_printers=None):
        for printer in network_printers:
            network_driver.get_network_printer(printer['ip'], name=printer['name'])

    @http.route('/hw_proxy/status_network_printers', type='json', auth='none', cors='*')
    def network_printers_status(self):
        return network_driver.network_printers
