# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2004-2011 Tiny SPRL (<http://tiny.be>).
#    Copyright (C) 2010-2011 Camptocamp (<http://www.camptocamp.at>)
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
from openerp.osv import fields, osv
import math

def check_ean(eancode):
     if not eancode:
         return True
     if not len(eancode) in [8,12,13,14]:
         return False
     try:
         int(eancode)
     except:
         return False
     res = ean_checksum(eancode) == int(eancode[-1])
     if not res and len(eancode)==8:
         res = ean_checksum(convert_UPCE_to_UPCA(eancode)) == int(eancode[-1])
     return res
# tests (should return empty list):
# [ (name, code) for name, code in (('upc-e','04904500'),('ean-13','2112345678900'),('ean-8','02345673'),('upc-a','416000336108'),('upc-e','00123457'),) if not check_ean(code)]

def ean_checksum(eancode):
    # eancode -- code without check digit
    oddsum=0
    evensum=0
    total=0
    eanvalue=eancode
    reversevalue = eanvalue[::-1]
    finalean=reversevalue[1:]
    for i in range(len(finalean)):
        if i % 2 == 0:
            oddsum += int(finalean[i])
        else:
            evensum += int(finalean[i])
    total=(oddsum * 3) + evensum
    check = int(10 - math.ceil(total % 10.0)) %10
    return check

# from http://code.activestate.com/recipes/528911-barcodes-convert-upc-e-to-upc-a/
def convert_UPCE_to_UPCA(upce_value):
    """Test value 04182635 -> 041800000265"""
    if len(upce_value)==6:
        middle_digits=upce_value #assume we're getting just middle 6 digits
    elif len(upce_value)==7:
        #truncate last digit, assume it is just check digit
        middle_digits=upce_value[:6]
    elif len(upce_value)==8:
        #truncate first and last digit,
        #assume first digit is number system digit
        #last digit is check digit
        middle_digits=upce_value[1:7]
    else:
        return False
    d1,d2,d3,d4,d5,d6=list(middle_digits)
    if d6 in ["0","1","2"]:
        mfrnum=d1+d2+d6+"00"
        itemnum="00"+d3+d4+d5
    elif d6=="3":
        mfrnum=d1+d2+d3+"00"
        itemnum="000"+d4+d5
    elif d6=="4":
        mfrnum=d1+d2+d3+d4+"0"
        itemnum="0000"+d5
    else:
        mfrnum=d1+d2+d3+d4+d5
        itemnum="0000"+d6
    newmsg="0"+mfrnum+itemnum
    #calculate check digit, they are the same for both UPCA and UPCE
    check_digit=ean_checksum(newmsg+'0')
    return newmsg+str(check_digit)


# need to replace the check_ean13_key function
class product_product(osv.osv):
    _inherit = "product.product"

    def _check_ean_key(self, cr, uid, ids, context=None):
        for rec in self.browse(cr, uid, ids, context=context):
            res = check_ean(rec.ean13)
        return res

    _columns = {
        'ean13': fields.char('EAN', help ='Code for EAN8 EAN13 UPC JPC GTIN http://de.wikipedia.org/wiki/Global_Trade_Item_Number', size=14),
    }

    _constraints = [(_check_ean_key, 'Error: Invalid EAN code', ['ean13'])]

product_product()

class product_template(osv.osv):
    _inherit = "product.template"

    def _check_ean_key(self, cr, uid, ids, context=None):
        for rec in self.browse(cr, uid, ids, context=context):
            res = check_ean(rec.ean13)
        return res

    _columns = {
        'ean13': fields.related('product_variant_ids', 'ean13', type='char', string='EAN'),

    }

product_template()


class product_packaging(osv.osv):
    _inherit = "product.packaging"

    def _check_ean_key(self, cr, uid, ids, context=None):
        for rec in self.browse(cr, uid, ids, context=context):
            res = check_ean(rec.ean)
        return res

    _columns = {
        'ean':    fields.char('EAN', help ='Barcode number for EAN8 EAN13 UPC JPC GTIN', size=14),
    }
    _constraints = [(_check_ean_key, 'Error: Invalid EAN code', ['ean'])]

product_packaging()


class res_partner(osv.osv):
    _inherit = "res.partner"

    def _check_ean_key(self, cr, uid, ids, context=None):
        for rec in self.browse(cr, uid, ids, context=context):
            res = check_ean(rec.ean13)
        return res

    _columns = {
        'ean13':    fields.char('EAN', help ='Code for EAN8 EAN13 UPC JPC GTIN http://de.wikipedia.org/wiki/Global_Trade_Item_Number', size=14),
    }

    _constraints = [(_check_ean_key, 'Error: Invalid EAN code', ['ean13'])]

res_partner()

#class wiz_ean13_check(wizard.interface):
#wiz_ean13_check()
